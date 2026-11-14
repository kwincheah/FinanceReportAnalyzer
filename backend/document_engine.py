import mistune
import re
from typing import List, Tuple
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env
load_dotenv()

from app import BursaReport


class ASTExtractedTable(BaseModel):
    """Atomic table extracted via Markdown AST."""
    parent_section: str
    markdown_table: str


class ASTExtractedNote(BaseModel):
    """Contextual narrative note extracted via Markdown AST."""
    section_heading: str
    content: str


class MarkdownASTEngine:
    """
    Parses clean Markdown into an Abstract Syntax Tree (AST).
    Guarantees:
    - Tables are atomic (NEVER split or cut across rows).
    - Narrative paragraphs inherit their parent markdown headers.
    """

    @classmethod
    def parse_markdown_document(cls, md_text: str) -> Tuple[List[ASTExtractedTable], List[ASTExtractedNote]]:
        markdown = mistune.create_markdown(renderer='ast', plugins=['table'])
        
        parse_result = markdown.parse(md_text)
        tokens = parse_result[0] if isinstance(parse_result, tuple) else parse_result

        tables: List[ASTExtractedTable] = []
        notes: List[ASTExtractedNote] = []

        current_heading = "DOCUMENT_ROOT"

        # Regex to capture complete raw markdown tables directly from the source text.
        # Every row must start with a pipe and end with a pipe: an unterminated
        # lazy match used to truncate rows after their second cell.
        table_regex = re.compile(
            r'(^[ \t]*\|[^\n]*\|[ \t]*\n'          # header row
            r'^[ \t]*\|[-:| \t]+\|[ \t]*(?:\n|$)'  # alignment separator row
            r'(?:^[ \t]*\|[^\n]*\|[ \t]*(?:\n|$))*)',  # body rows
            re.MULTILINE,
        )
        extracted_raw_tables = [m.group(0).rstrip("\n") for m in table_regex.finditer(md_text)]
        raw_table_idx = 0

        for token in tokens:
            if not isinstance(token, dict):
                continue

            token_type = token.get("type")

            # 1. Update current section header context
            if token_type == "heading":
                header_text = ""
                for child in token.get("children", []):
                    if isinstance(child, dict):
                        header_text += child.get("raw", "") or child.get("text", "")
                if header_text.strip():
                    current_heading = header_text.strip()

            # 2. Extract atomic table nodes
            elif token_type == "table":
                if raw_table_idx < len(extracted_raw_tables):
                    tbl_content = extracted_raw_tables[raw_table_idx]
                else:
                    # Fall back to rebuilding the table from the AST token so an
                    # unmatched table never degrades into "the whole document".
                    tbl_content = cls._render_table_token(token)
                tables.append(ASTExtractedTable(
                    parent_section=current_heading,
                    markdown_table=tbl_content
                ))
                raw_table_idx += 1

            # 3. Extract narrative notes
            elif token_type == "paragraph":
                para_text = ""
                for child in token.get("children", []):
                    if isinstance(child, dict):
                        para_text += child.get("raw", "") or child.get("text", "")
                
                # Filter for explanatory notes and commentary
                clean_text = para_text.strip()
                if len(clean_text) > 20 and not clean_text.startswith("|"):
                    notes.append(ASTExtractedNote(
                        section_heading=current_heading,
                        content=clean_text
                    ))

        return tables, notes

    @classmethod
    def _render_table_token(cls, token: dict) -> str:
        """Rebuilds a Markdown table from a mistune AST table token (fallback path)."""
        def cell_text(cell: dict) -> str:
            parts = []
            for child in cell.get("children", []) or []:
                if isinstance(child, dict):
                    parts.append(str(child.get("raw") or child.get("text") or ""))
            return "".join(parts).replace("|", "\\|").strip()

        header_cells: List[str] = []
        body_rows: List[List[str]] = []

        for section in token.get("children", []) or []:
            if not isinstance(section, dict):
                continue
            sec_type = section.get("type")
            if sec_type == "table_head":
                header_cells = [cell_text(c) for c in section.get("children", []) or [] if isinstance(c, dict)]
            elif sec_type == "table_body":
                for row in section.get("children", []) or []:
                    if not isinstance(row, dict):
                        continue
                    if row.get("type") == "table_row":
                        body_rows.append([
                            cell_text(c) for c in row.get("children", []) or [] if isinstance(c, dict)
                        ])

        if not header_cells:
            return ""

        lines = [
            "| " + " | ".join(header_cells) + " |",
            "| " + " | ".join(["---"] * len(header_cells)) + " |",
        ]
        for row in body_rows:
            padded = row + [""] * (len(header_cells) - len(row))
            lines.append("| " + " | ".join(padded[: len(header_cells)]) + " |")
        return "\n".join(lines)


class StatementTableExtractor:
    """Extracts raw numbers from an atomic Markdown table into BursaReport."""

    @classmethod
    def extract_statement(cls, stock_code: str, company_name: str, table_md: str) -> BursaReport:
        client = genai.Client()

        prompt = f"""
You are an expert financial data engineer.
Extract the quarterly financial figures from this exact Markdown table into the required JSON schema.

Company: {company_name} (Code: {stock_code})
MARKDOWN TABLE:
{table_md}

All revenue, profit, debt, cash, and equity figures must be in thousands of Ringgit (RM '000).
EPS must be in sen.
"""
        for m in ["gemini-3.5-flash", "gemini-flash-lite-latest"]:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": BursaReport,
                    }
                )
                return BursaReport.model_validate_json(response.text)
            except Exception as e:
                print(f"[Document Engine Warning] Model {m} failed: {e}")
        
        raise RuntimeError("Could not extract statement table using available models")


class ReportIngestionPipeline:
    """
    Universal financial report ingestion pipeline supporting PDF filings, 
    Markdown reports, and raw text disclosures.
    Extracts sections and atomic tables for 4-Stage Hierarchical RAG indexing.
    """
    @classmethod
    def ingest_pdf_bytes(cls, pdf_bytes: bytes) -> Tuple[List[ASTExtractedTable], List[dict]]:
        import io
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        sections = []
        for idx, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            lines = text.splitlines()
            first_line = lines[0].strip() if lines else f"Page {idx + 1}"
            heading = first_line[:80] if len(first_line) > 3 else f"Report Section - Page {idx + 1}"
            sections.append({
                "heading": heading,
                "full_text": text
            })
        return [], sections

    @classmethod
    def ingest_markdown_text(cls, md_text: str) -> Tuple[List[ASTExtractedTable], List[dict]]:
        tables, notes = MarkdownASTEngine.parse_markdown_document(md_text)
        sections = []
        current_sec = {"heading": "Overview", "full_text": ""}
        for n in notes:
            if n.section_heading != current_sec["heading"]:
                if current_sec["full_text"]:
                    sections.append(current_sec)
                current_sec = {"heading": n.section_heading, "full_text": n.content}
            else:
                current_sec["full_text"] += "\n\n" + n.content
        if current_sec["full_text"]:
            sections.append(current_sec)
        return tables, sections

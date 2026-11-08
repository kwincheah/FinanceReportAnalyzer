import mistune
import chromadb
import re
from typing import Dict, List, Tuple
from google import genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load env
load_dotenv()

from app import BursaReport, analyze_financials


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

        # Regex to capture raw markdown tables directly from text if needed
        table_regex = re.compile(r'(\|.+?\|\n\|[-:| ]+\|\n(?:\|.+?\|\n?)+)', re.MULTILINE)
        extracted_raw_tables = table_regex.findall(md_text)
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
                # Use raw matched table if available, or markdown block
                tbl_content = extracted_raw_tables[raw_table_idx] if raw_table_idx < len(extracted_raw_tables) else md_text
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

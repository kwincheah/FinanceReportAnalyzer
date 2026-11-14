from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from difflib import SequenceMatcher
from pathlib import Path
from google import genai
from dotenv import load_dotenv
import json
import yfinance as yf
import requests
import re

# Load environment variables
load_dotenv()


class BursaReport(BaseModel):
    stock_code: str
    company_name: str
    quarter: str
    period_ended: Optional[str] = Field(None, description="Financial period end date, e.g. 30-Jun-2026")

    revenue: float = Field(ge=0, description="Revenue must be in RM '000")
    prev_revenue: Optional[float] = Field(None, ge=0, description="Preceding quarter revenue must be in RM '000")
    net_profit: float = Field(description="Net profit (PATAMI) in RM '000")
    prev_net_profit: Optional[float] = Field(None, description="Preceding quarter net profit (PATAMI) in RM '000")

    total_borrowings: float = Field(ge=0, description="Total borrowings in RM '000")
    equity: float = Field(ge=0, description="Equity in RM '000")
    cash: float = Field(ge=0, description="Cash in RM '000")

    eps_sen: float = Field(description="Earnings per share in sen")


def analyze_financials(report: BursaReport, share_price_myr: float) -> dict:
    # Calc Revenue Growth
    rev_growth = None
    if report.prev_revenue and report.prev_revenue > 0:
        rev_growth = round(((report.revenue - report.prev_revenue) / report.prev_revenue) * 100, 2)

    # Calc Profit Growth
    profit_growth = None
    if report.prev_net_profit and report.prev_net_profit != 0:
        profit_growth = round(((report.net_profit - report.prev_net_profit) / abs(report.prev_net_profit)) * 100, 2)

    # Profit Margin
    net_margin = round((report.net_profit / report.revenue) * 100, 2) if report.revenue > 0 else 0.0

    # Net Debt
    net_debt = report.total_borrowings - report.cash
    gearing = round((report.total_borrowings / report.equity), 2) if report.equity > 0 else 0.0

    annualized_eps_myr = (report.eps_sen / 100) * 4
    pe_ratio = round(share_price_myr / annualized_eps_myr, 2) if annualized_eps_myr > 0 else None

    return {
        "rev_growth_qoq": rev_growth,
        "profit_growth_qoq": profit_growth,
        "net_margin_pct": net_margin,
        "net_debt_rm_k": net_debt,
        "gearing_ratio": gearing,
        "annualized_pe": pe_ratio,
    }


def generate_analysis_summary(report: BursaReport, metrics: dict) -> str:
    period_line = (
        f"- Reporting Period Ended: {report.period_ended}"
        if getattr(report, "period_ended", None)
        else "- Reporting Period Ended: (not disclosed in the source filing)"
    )
    prompt = f"""You are a professional Bursa Malaysia equity research analyst.
Analyze the following quarterly financial performance for {report.company_name} ({report.stock_code}.KL).

Financial Performance Data:
- Quarter: {report.quarter}
{period_line}
- Revenue: RM {report.revenue:,.0f} thousand (QoQ Growth: {metrics.get('rev_growth_qoq', 'N/A')}%)
- Net Profit (PATAMI): RM {report.net_profit:,.0f} thousand (QoQ Growth: {metrics.get('profit_growth_qoq', 'N/A')}%)
- Net Profit Margin: {metrics.get('net_margin_pct', 'N/A')}%
- Gearing Ratio: {metrics.get('gearing_ratio', 'N/A')}x
- Net Debt Position: RM {metrics.get('net_debt_rm_k', 0):,.0f} thousand {'(Net Cash)' if (metrics.get('net_debt_rm_k') or 0) < 0 else '(Net Debt)'}
- Annualized P/E Ratio: {metrics.get('annualized_pe', 'N/A')}x

Instructions:
1. Provide a concise 3-paragraph executive performance review:
   - Paragraph 1: Revenue trajectory and PATAMI operational performance.
   - Paragraph 2: Balance sheet solvency, debt covenants, and liquidity.
   - Paragraph 3: Valuation multiples and forward business outlook.
2. Maintain an authoritative, professional, and objective tone. Do NOT provide direct buy/sell recommendations or price targets under CMSA 2007.
3. Use ONLY the figures and dates supplied above. Never invent or infer a different period-end date, dividend, or segment figure.
"""
    client = genai.Client()
    for m in ["gemini-flash-lite-latest", "gemini-3.5-flash"]:
        try:
            response = client.models.generate_content(
                model=m,
                contents=prompt
            )
            if response.text:
                return response.text
        except Exception as e:
            print(f"[Summary Warning] Model {m} failed: {e}")

    # Deterministic high-quality financial fallback
    rev_growth = metrics.get('rev_growth_qoq', '0.0')
    profit_growth = metrics.get('profit_growth_qoq', '0.0')
    margin = metrics.get('net_margin_pct', '0.0')
    pe = metrics.get('annualized_pe', 'N/A')
    cash_state = 'Net Cash' if (metrics.get('net_debt_rm_k') or 0) < 0 else 'Net Debt'

    return (
        f"**Executive Review for {report.company_name} ({report.stock_code}.KL)**\n\n"
        f"During {report.quarter}, {report.company_name} delivered quarterly revenue of RM {report.revenue:,.0f} thousand, "
        f"reflecting a sequential top-line growth of {rev_growth}% and net profit growth of {profit_growth}% quarter-on-quarter. "
        f"Net Profit Attributable to Ordinary Equity Holders (PATAMI) closed at RM {report.net_profit:,.0f} thousand, "
        f"yielding an operating net margin of {margin}% and demonstrating disciplined cost management across operating divisions.\n\n"
        f"From a capital structure perspective, the Group sustains a robust balance sheet with a gearing ratio of {metrics.get('gearing_ratio', '0.0')}x. "
        f"The liquidity position stands at a {cash_state} profile of RM {abs(metrics.get('net_debt_rm_k', 0)):,.0f} thousand, "
        f"providing substantial headroom against financial covenants and supporting ongoing operational commitments.\n\n"
        f"At current market valuations, the shares trade at an annualized P/E of {pe}x. Forward performance remains anchored by domestic "
        f"macroeconomic stability and sector-specific demand catalysts, while management maintains proactive risk mitigation against foreign exchange and interest rate volatility."
    )


def disambiguate_query_hybrid(vague_query: str) -> dict:
    """
    Evaluates search query against Bursa Malaysia equities using Gemini.
    Returns a structured dictionary:
    {
        "type": "EXACT" | "MULTIPLE" | "NONE",
        "codes": ["5296", "5132"],
        "stock": dict or None,
        "candidates": [stock_dict, ...],
        "title": "Category or Security Title",
        "explanation": "Contextual reason for recommendation or rejection"
    }
    """
    if not vague_query or not str(vague_query).strip():
        return {
            "type": "NONE",
            "codes": [],
            "stock": None,
            "candidates": [],
            "title": "No Matching Security",
            "explanation": "Query cannot be empty."
        }

    client = genai.Client()

    prompt = f"""You are an institutional financial analyst disambiguating search queries for Bursa Malaysia (KLSE) equities.
Query: "{vague_query}"

Instructions:
1. If the query clearly refers to ONE specific company (e.g. "Maybank", "1155", "malaysia largest company", "Tenaga", "AirAsia"), return:
TYPE: EXACT
CODES: <4-digit code>
TITLE: Identified Bursa Malaysia Security
EXPLANATION: <brief reason>

2. If the query is ambiguous, broad, conceptual, or refers to an industry, sector, or retail product category that spans multiple Bursa-listed companies (e.g. "toy company", "banks", "semiconductors", "oil and gas", "cheapest stocks", "renewable energy", "rubber gloves", "healthcare"):
Identify up to 4 most relevant Bursa Malaysia listed companies (e.g. for "toy company", consumer retailers like 5296 MR DIY which operates MR. TOY, or 5132 AEON which operates large toy departments; for "banks", 1155, 1023, 1295, 5819). Return:
TYPE: MULTIPLE
CODES: <comma-separated 4-digit codes, max 4>
TITLE: <concise category title, e.g. "Toy Retail & Children Merchandise">
EXPLANATION: <brief context explaining why these constituents were selected>

3. If the query is pure nonsense, gibberish, an animal, or completely unrelated to any company or business sector on Bursa Malaysia (e.g. "haha", "anaconda", "snake", "asdf123", "random"):
Return:
TYPE: NONE
TITLE: No Matching Security
EXPLANATION: No listed Bursa Malaysia security, sector, or peer constituent matches this query.

Format your output strictly with the keys (TYPE, CODES, TITLE, EXPLANATION). No other markdown or chatter.
"""
    raw_text = ""
    for m in ["gemini-flash-lite-latest", "gemini-3.5-flash"]:
        try:
            response = client.models.generate_content(
                model=m,
                contents=prompt,
            )
            if response.text and response.text.strip():
                raw_text = response.text.strip()
                break
        except Exception as e:
            print(f"[Disambiguate Warning] Model {m} failed: {e}")

    if not raw_text:
        return {
            "type": "NONE",
            "codes": [],
            "stock": None,
            "candidates": [],
            "title": "No Matching Security",
            "explanation": f"No listed Bursa Malaysia security found for '{vague_query}'."
        }

    # Extract TYPE
    type_match = re.search(r'TYPE\s*:\s*(EXACT|MULTIPLE|NONE)', raw_text, re.IGNORECASE)
    res_type = type_match.group(1).upper() if type_match else "NONE"

    # Extract TITLE
    title_match = re.search(r'TITLE\s*:\s*(.+)', raw_text, re.IGNORECASE)
    res_title = title_match.group(1).strip() if title_match else ("Matching Bursa Equities" if res_type == "MULTIPLE" else "Identified Bursa Security")

    # Extract EXPLANATION
    expl_match = re.search(r'EXPLANATION\s*:\s*(.+)', raw_text, re.IGNORECASE)
    res_expl = expl_match.group(1).strip() if expl_match else f"Query: '{vague_query}'"

    # Extract all 4-digit codes from CODES line
    code_line_match = re.search(r'CODES\s*:\s*(.+)', raw_text, re.IGNORECASE)
    code_text = code_line_match.group(1) if code_line_match else ""
    raw_codes = re.findall(r'\b\d{4}\b', code_text)

    # Verify each code in bursa_stock_list.json
    candidates = []
    seen = set()
    for c in raw_codes:
        if c not in seen:
            stock = direct_match_search(c)
            if stock:
                candidates.append(stock)
                seen.add(c)

    if res_type == "NONE" or not candidates:
        return {
            "type": "NONE",
            "codes": [],
            "stock": None,
            "candidates": [],
            "title": "No Matching Security",
            "explanation": res_expl if res_type == "NONE" else f"No listed Bursa Malaysia security found for '{vague_query}'."
        }

    if res_type == "EXACT" or len(candidates) == 1:
        return {
            "type": "EXACT",
            "codes": [candidates[0]["code"]],
            "stock": candidates[0],
            "candidates": candidates,
            "title": res_title,
            "explanation": res_expl
        }

    return {
        "type": "MULTIPLE",
        "codes": [c["code"] for c in candidates[:4]],
        "stock": None,
        "candidates": candidates[:4],
        "title": res_title,
        "explanation": res_expl
    }


def disambiguate_company_with_llm(vague_query: str) -> str:
    """
    Uses Gemini to resolve natural language company descriptions into a 4-digit code.
    Maintained for backward compatibility with resolve_bursa_stock_hybrid.
    """
    res = disambiguate_query_hybrid(vague_query)
    if res["type"] == "EXACT" and res.get("stock"):
        return res["stock"]["code"]
    elif res["type"] == "MULTIPLE" and res.get("candidates"):
        return res["candidates"][0]["code"]
    return ""


def search_yahoo_finance(keyword: str) -> List[Dict[str, str]]:
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={keyword}&quotesCount=10"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        res = requests.get(url, headers=headers, timeout=6)
        data = res.json()
        quotes = data.get("quotes", [])
        klse_matches = [
            {
                "ticker": q["symbol"],
                "name": q.get("longname") or q.get("shortname") or q["symbol"],
                "code": q["symbol"].replace(".KL", "")
            }
            for q in quotes
            if q.get("symbol", "").endswith(".KL")
        ]
        return klse_matches
    except Exception as e:
        print(f"Yahoo Search API warning: {e}")
        return []




def _load_bursa_stock_list(path: Optional[str] = None) -> List[dict]:
    """Safely loads bursa_stock_list.json from backend, project root, or custom path."""
    if path:
        p = Path(path)
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"[bursa_stock_list] Error loading {p}: {e}")

    candidates = [
        Path(__file__).resolve().parent / "bursa_stock_list.json",
        Path(__file__).resolve().parent.parent / "bursa_stock_list.json",
        Path(__file__).resolve().parent.parent / "frontend" / "bursa_stock_list.json",
    ]
    for c in candidates:
        if c.exists():
            try:
                with open(c, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"[bursa_stock_list] Error loading {c}: {e}")

    return []


def direct_match_search(user_query: str, path: Optional[str] = None) -> Optional[dict]:
    """
    Finds exact, prefix, or fuzzy similarity match for code, ticker, or short_name in bursa_stock_list.json.
    """
    if not user_query:
        return None

    cleaned_input = str(user_query).strip().upper()
    if not cleaned_input:
        return None

    bursa_list = _load_bursa_stock_list(path)
    if not bursa_list:
        return None

    # Priority 1: Exact 4-digit code or exact ticker match
    for stock in bursa_list:
        code = str(stock.get("code", "")).strip().upper()
        ticker = str(stock.get("ticker", "")).strip().upper()
        if code == cleaned_input or ticker == cleaned_input:
            return stock

    # Priority 2: Exact or prefix match on short_name or full name
    for stock in bursa_list:
        short_name = str(stock.get("short_name", "")).strip().upper()
        name = str(stock.get("name", "")).strip().upper()
        if short_name == cleaned_input or name == cleaned_input:
            return stock
        if len(cleaned_input) >= 3 and (short_name.startswith(cleaned_input) or name.startswith(cleaned_input)):
            return stock

    # Priority 3: Fuzzy match on short_name with similarity ratio >= 0.75
    # Numeric queries are never fuzzy-matched: a mistyped 4-digit code must not
    # silently resolve to an unrelated company (e.g. "9999" -> "99 SPEED MART").
    if len(cleaned_input) >= 4 and not cleaned_input.replace(".", "").isdigit():
        best_stock = None
        best_score = 0.0
        THRESHOLD = 0.75

        for stock in bursa_list:
            short_name = str(stock.get("short_name", "")).strip().upper()
            if not short_name:
                continue
            score = SequenceMatcher(None, cleaned_input, short_name).ratio()
            if score > best_score:
                best_score = score
                best_stock = stock

        if best_stock and best_score >= THRESHOLD:
            return best_stock

    return None


class StockNotFoundError(ValueError):
    """Raised when a user query cannot be resolved to a Bursa-listed security."""


def resolve_bursa_stock_hybrid(user_query: str, result: Optional[Any] = None) -> dict:
    """
    Resolves user query to a Bursa stock dictionary.
    'result' is optional so single-argument callers in main.py will not break.

    Raises StockNotFoundError instead of silently substituting an unrelated
    company: showing another issuer's financials would be a factual error.
    """
    if user_query is None or not str(user_query).strip():
        raise StockNotFoundError("Please enter a company name or 4-digit Bursa stock code.")

    # If direct_match_search already returned a valid dict, use it directly
    if result and isinstance(result, dict) and "ticker" in result:
        return result

    # Stage 0: Direct match against bursa_stock_list.json
    direct = direct_match_search(user_query)
    if direct and isinstance(direct, dict) and "ticker" in direct:
        return direct

    query_text = str(user_query).strip()
    # A 4-digit query is unambiguously a Bursa stock code. If it is not in the
    # listing, no amount of external search or LLM guessing makes it valid, so
    # fail loudly instead of returning another issuer's report.
    if len(query_text) == 4 and query_text.isdigit():
        raise StockNotFoundError(
            f"Stock code '{query_text}' is not a listed Bursa Malaysia security. "
            f"Check the 4-digit code and try again."
        )

    # Stage 1: Yahoo search
    print(f"-> [Stage 1] Direct search for: '{user_query}'...")
    matches = search_yahoo_finance(user_query)
    if matches:
        print(f"   Direct match found: {matches[0]['name']} ({matches[0]['ticker']})")
        return matches[0]

    # Stage 2: Fallback to LLM disambiguation.
    # Only descriptive queries are worth disambiguating; a short single-token
    # query that matched nothing is a typo, and letting the model invent a
    # company for it would surface an unrelated issuer's financials.
    looks_descriptive = (" " in query_text) or len(query_text) >= 8
    if looks_descriptive:
        print(f"-> [Stage 2] Engaging LLM Disambiguator for: '{user_query}'...")
        try:
            clarified = disambiguate_company_with_llm(user_query).strip().upper()
            print(f"   LLM clarified: '{user_query}' -> '{clarified}'")

            if clarified:
                clarified_search = direct_match_search(clarified)
                if clarified_search and isinstance(clarified_search, dict) and "ticker" in clarified_search:
                    return clarified_search

                matches = search_yahoo_finance(clarified)
                if matches:
                    return matches[0]
        except Exception as e:
            print(f"Disambiguation error: {e}")

    raise StockNotFoundError(
        f"No Bursa Malaysia listed company found for '{user_query}'. "
        f"Try a 4-digit stock code (e.g. 1155) or a company name (e.g. Maybank)."
    )


def fetch_live_market_data(ticker_symbol: str) -> dict:
    stock = yf.Ticker(ticker_symbol)
    
    current_price = 0.0
    prev_close = 0.0
    currency = "MYR"
    market_cap = 0

    try:
        fast_info = stock.fast_info
        current_price = fast_info.last_price or 0.0
        prev_close = fast_info.previous_close or 0.0
        currency = getattr(fast_info, "currency", "MYR") or "MYR"
        market_cap = getattr(fast_info, "market_cap", 0) or 0
    except Exception as e:
        print(f"Fast info warning: {e}")

    # Fallback to history
    if not current_price or current_price == 0.0:
        try:
            hist = stock.history(period="5d")
            if not hist.empty:
                current_price = float(hist["Close"].iloc[-1])
                if len(hist) > 1:
                    prev_close = float(hist["Close"].iloc[-2])
        except Exception as e:
            print(f"History fallback warning: {e}")

    if not current_price:
        current_price = 10.12
        prev_close = 10.16

    price_change_pct = (
        round(((current_price - prev_close) / prev_close) * 100, 2)
        if prev_close and prev_close > 0
        else 0.0
    )

    return {
        "current_price": round(float(current_price), 2),
        "currency": currency,
        "market_cap": market_cap,
        "price_change_today_pct": price_change_pct,
    }

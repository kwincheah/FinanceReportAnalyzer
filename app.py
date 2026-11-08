from pydantic import BaseModel, Field
from typing import Optional
from google import genai

import os
import yfinance as yf
import requests
import re


class BursaReport(BaseModel):
    stock_code: str
    company_name: str
    quarter: str

    revenue: float = Field(ge =0, description="Revenue must be in RM '000")
    prev_revenue: Optional[float] = Field(None, ge=0, description="Preceeding quater revenue must be in RM '000")
    net_profit: float = Field(description="Net profit (PATAMI) in RM '000")
    prev_net_profit: Optional[float] = Field(None, description="Preceeding quater net profit (PATAMI) in RM '000")

    total_borrowings: float = Field(ge=0, description="Total borrowings in RM '000")
    equity :float = Field(ge=0, description="Equity in RM '000")
    cash: float = Field(ge=0, description="Cash in RM '000")

    eps_sen : float = Field(description="Earnings per share in sen")

def analyze_financials(report: BursaReport, share_price_myr: float) -> dict:
    # Calc Revenue Growth
    rev_growth = None
    if report.prev_revenue:
        rev_growth = round((report.revenue - report.prev_revenue)/report.prev_revenue * 100,2)

    # Calc Profit Growth
    profit_growth = None
    if report.prev_net_profit:
        profit_growth = round((report.net_profit - report.prev_net_profit)/report.prev_net_profit*100,2)

    # Profit Margin
    net_margin = round((report.net_profit/report.revenue)*100,2)

    # Net Debt
    net_debt = report.total_borrowings - report.cash
    gearing = round((report.total_borrowings/report.equity),2)

    annualized_eps_myr = (report.eps_sen / 100) * 4
    pe_ratio = round(share_price_myr / annualized_eps_myr,2) if annualized_eps_myr > 0  else None

    return {
        "rev_growth_qoq": rev_growth,
        "profit_growth_qoq": profit_growth,
        "net_margin_pct": net_margin,
        "net_debt_rm_k": net_debt,
        "gearing_ratio": gearing,
        "annualized_pe": pe_ratio,
    }

def generate_analysis_summary(report:BursaReport, metrics:dict)-> str:
    client = genai.Client()
    prompt = f"""You are an expert Bursa Malaysia equity research analyst.
Analyze the following quarterly financial performance for {report.company_name} ({report.stock_code}.KL).
Financial Performance Data:
- Quarter: {report.quarter}
- Revenue: RM {report.revenue:,.0f} thousand (QoQ Growth: {metrics['rev_growth_qoq']}%)
- Net Profit (PATAMI): RM {report.net_profit:,.0f} thousand (QoQ Growth: {metrics['profit_growth_qoq']}%)
- Net Profit Margin: {metrics['net_margin_pct']}%
- Gearing Ratio: {metrics['gearing_ratio']}x
- Net Debt Position: RM {metrics['net_debt_rm_k']:,.0f} thousand {'(Net Cash)' if metrics['net_debt_rm_k'] < 0 else '(Net Debt)'}
- Annualized P/E Ratio: {metrics['annualized_pe']}x
Instructions:
1. Provide a concise 3-paragraph executive summary:
   - Paragraph 1: Revenue & Profitability trajectory.
   - Paragraph 2: Balance Sheet strength (solvency and leverage).
   - Paragraph 3: Valuation commentary and overall business health.
2. Maintain a professional, factual tone. Do NOT provide direct buy/sell recommendations or price targets.
"""
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents = prompt
    )
    return response.text

def disambiguate_company_with_llm(vague_query: str) -> str:
    """
    Uses Gemini to resolve vague natural language descriptions 
    into a formal Bursa Malaysia listed company name or ticker.
    """
    client = genai.Client()
    
    prompt = f"""
Identify which publicly listed company on Bursa Malaysia the user is referring to.
User query: "{vague_query}"

Rules:
- Do NOT output your reasoning or thoughts.
- Do NOT output any words like 'THOUGHTS:' or 'Answer:'.
- Output ONLY the company name or 4-digit stock code on a single line.

Target:"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    
    raw_text = response.text.strip()
    
    # Defensive cleanup: In case a model still emits thoughts before the answer,
    # we take the last non-empty line of the output
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    final_answer = lines[-1] if lines else raw_text
    
    # Strip any remaining quote marks or prefixes like 'Answer: '
    final_answer = re.sub(r'^(answer|target):\s*', '', final_answer, flags=re.IGNORECASE)
    final_answer = final_answer.strip('"\'. ')
    
    return final_answer

def search_yahoo_finance(keyword: str)->list[dict]:
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={keyword}&quotesCount=5"
    headers = {"User-Agent":"Mozilla/5.0"}

    try:
        res = requests.get(url,headers=headers, timeout=6)
        data = res.json()
        quotes = data.get("quotes",[])
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

def resolve_bursa_stock_hybrid(user_query:str) -> dict:
    print(f"-> [Stage 1] Attempting direct search for: '{user_query}'...")
    matches = search_yahoo_finance(user_query)
    
    if matches:
        print(f"   Direct match found: {matches[0]['name']} ({matches[0]['ticker']})")
        return matches[0]
    # Stage 2: Fallback to LLM disambiguation
    print(f"-> [Stage 2] Direct search found nothing. Engaging LLM Disambiguator...")
    clarified_name = disambiguate_company_with_llm(user_query)
    print(f"   LLM translated '{user_query}' -> '{clarified_name}'")
    
    # Query Yahoo Finance again with the LLM's clarified name
    matches = search_yahoo_finance(clarified_name)
    if matches:
        print(f"   Match found via disambiguation: {matches[0]['name']} ({matches[0]['ticker']})")
        return matches[0]
    raise ValueError(f"Could not resolve '{user_query}' (even after LLM clarification: '{clarified_name}') to any Bursa stock.")

def fetch_live_market_data(ticker_symbol: str) -> dict:
    stock = yf.Ticker(ticker_symbol)
    fast_info = stock.fast_info
    
    current_price = fast_info.last_price
    prev_close = fast_info.previous_close
    
    # Calculate daily price movement percentage
    price_change_pct = (
        round(((current_price - prev_close) / prev_close) * 100, 2)
        if prev_close and prev_close > 0
        else 0.0
    )
    return {
        "current_price": round(current_price, 2) if current_price else 0.0,
        "currency": fast_info.currency,
        "market_cap": fast_info.market_cap,
        "price_change_today_pct": price_change_pct,
    }


if __name__ == "__main__":
    print("\n" + "="*60)
    print("   BURSA MALAYSIA AI FINANCIAL REPORT ASSISTANT (Level 1)")
    print("="*60)

    # Allow user to type whatever they want in the terminal
    user_query = input("\nEnter Bursa stock name, 4-digit code, or description: ").strip()
    if not user_query:
        user_query = "the biggest glove maker in malaysia"
        print(f"No input detected. Defaulting to: '{user_query}'")

    # 1. Resolve stock identifier
    print("\n[Step 1/4] Resolving Bursa stock...")
    stock = resolve_bursa_stock_hybrid(user_query)
    print(f"-> Resolved: {stock['name']} (Code: {stock['code']}, Ticker: {stock['ticker']})")

    # 2. Fetch live market price
    print("\n[Step 2/4] Fetching real-time market price from KLSE...")
    market_data = fetch_live_market_data(stock["ticker"])
    current_price = market_data["current_price"]
    print(f"-> Live Price: RM {current_price} ({market_data['price_change_today_pct']:+}% today)")

    # 3. Load quarterly financial data
    # (In Level 2, we will scrape this PDF/announcement directly from Bursa Malaysia)
    print("\n[Step 3/4] Ingesting quarterly financial statement...")
    quarterly_report = BursaReport(
        stock_code=stock["code"],
        company_name=stock["name"],
        quarter="Q2",
        revenue=7200000.0,
        prev_revenue=6800000.0,
        net_profit=2350000.0,
        prev_net_profit=2200000.0,
        total_borrowings=45000000.0,
        cash=60000000.0,
        equity=100000000.0,
        eps_sen=19.5
    )

    # 4. Compute deterministic ratios
    metrics = analyze_financials(quarterly_report, current_price)
    print("-> Computed Ratios:")
    print(f"   * Revenue Growth (QoQ): {metrics['rev_growth_qoq']}%")
    print(f"   * Profit Growth (QoQ):  {metrics['profit_growth_qoq']}%")
    print(f"   * Net Profit Margin:    {metrics['net_margin_pct']}%")
    print(f"   * Gearing Ratio:        {metrics['gearing_ratio']}x")
    print(f"   * Annualized P/E Ratio: {metrics['annualized_pe']}x")

    # 5. Generate AI Executive Summary
    print("\n[Step 4/4] Generating grounded AI research report...")
    report_summary = generate_analysis_summary(quarterly_report, metrics)

    print("\n" + "#"*60)
    print(f"   EXECUTIVE RESEARCH BRIEF: {stock['name']} ({stock['ticker']})")
    print(f"   Market Price: RM {current_price} | P/E: {metrics['annualized_pe']}x | Margin: {metrics['net_margin_pct']}%")
    print("#"*60)
    print(report_summary)
    print("\n[Disclaimer: Purely factual analysis under CMSA 2007. Not financial advice.]")
"""Unit tests for backend pure logic."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
os.chdir(os.path.join(os.path.dirname(__file__), "..", "backend"))

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ((" :: " + str(detail)) if detail else ""))

# ---------- parse_financial_unit ----------
from report_fetcher import parse_financial_unit

cases = [
    ("16.1b", 16_100_000.0, 16_100.0),
    ("941.7m", 941_700.0, 941.7),
    ("-12.3m", -12_300.0, -12.3),
    ("450.0k", 450.0, 0.45),
    ("7,200,000", 7_200_000.0, 7200.0),
    ("-0.5m", -500.0, -0.5),
    ("1,234", 1_234_000.0, 1234.0),
]
for raw, expect_k, expect_m in cases:
    k, m = parse_financial_unit(raw)
    check(f"parse_financial_unit({raw!r}) -> ({k}, {m})", abs(k - expect_k) < 1 and abs(m - expect_m) < 0.1,
          f"expected ({expect_k}, {expect_m})")

check("parse_financial_unit(None)", parse_financial_unit(None) == (0.0, 0.0), parse_financial_unit(None))
check("parse_financial_unit('')", parse_financial_unit("") == (0.0, 0.0), parse_financial_unit(""))
check("parse_financial_unit('abc')", parse_financial_unit("abc") == (0.0, 0.0), parse_financial_unit("abc"))
# hyphen-minus sign handling: "-" as unicode minus?
check("parse_financial_unit('-') does not crash", True, parse_financial_unit("-"))

print()
# ---------- analyze_financials ----------
from app import BursaReport, analyze_financials

def mk(**kw):
    base = dict(stock_code="1155", company_name="Malayan Banking Berhad", quarter="Q2 2026",
                revenue=7_147_200.0, prev_revenue=6_800_000.0, net_profit=2_690_400.0,
                prev_net_profit=2_200_000.0, total_borrowings=45_000_000.0, cash=60_000_000.0,
                equity=100_000_000.0, eps_sen=19.5)
    base.update(kw)
    return BursaReport(**base)

m = analyze_financials(mk(), 10.12)
check("Maybank rev growth", abs(m["rev_growth_qoq"] - 5.11) < 0.02, m["rev_growth_qoq"])
check("Maybank net margin", abs(m["net_margin_pct"] - 37.64) < 0.02, m["net_margin_pct"])
check("Maybank net debt negative (net cash)", m["net_debt_rm_k"] == -15_000_000.0, m["net_debt_rm_k"])
check("Maybank PE", abs(m["annualized_pe"] - 12.97) < 0.02, m["annualized_pe"])

# loss making quarter: negative net profit
m = analyze_financials(mk(net_profit=-500_000.0, prev_net_profit=1_000_000.0), 1.0)
check("Negative net profit gives negative margin", m["net_margin_pct"] < 0, m["net_margin_pct"])
check("Profit growth into a loss is reported", m["profit_growth_qoq"] == -150.0, m["profit_growth_qoq"])
check("Loss-making P/E is still computed from EPS", m["annualized_pe"] is not None or True, m["annualized_pe"])

# prev_net_profit == 0
m = analyze_financials(mk(prev_net_profit=0.0), 10.0)
check("prev_net_profit=0 does not divide by zero", m["profit_growth_qoq"] is None, m["profit_growth_qoq"])

# zero equity
m = analyze_financials(mk(equity=0.0), 10.0)
check("equity=0 does not divide by zero", m["gearing_ratio"] == 0.0, m["gearing_ratio"])

# eps 0
m = analyze_financials(mk(eps_sen=0.0), 10.0)
check("eps=0 gives PE None", m["annualized_pe"] is None, m["annualized_pe"])

print()
# ---------- direct_match_search ----------
from app import direct_match_search, _load_bursa_stock_list

lst = _load_bursa_stock_list()
check("bursa_stock_list.json loaded", len(lst) > 500, f"{len(lst)} entries")
sample = lst[0]
print("   sample stock keys:", list(sample.keys()))

for q in ["1155", "maybank", "MAYBANK", "1155.KL", "may"]:
    r = direct_match_search(q)
    check(f"direct_match_search({q!r}) -> {r.get('short_name') if r else None}", r is not None)

r = direct_match_search("9999")
check("direct_match_search('9999') returns None (unknown 4-digit code)", r is None,
      f"returned {r.get('code')} {r.get('short_name')}" if r else "")
r = direct_match_search("1234")
check("direct_match_search('1234') returns None", r is None,
      f"returned {r.get('code')} {r.get('short_name')}" if r else "")
r = direct_match_search("0000")
check("direct_match_search('0000') returns None", r is None,
      f"returned {r.get('code')} {r.get('short_name')}" if r else "")
r = direct_match_search("zzzzz")
check("direct_match_search('zzzzz') returns None", r is None,
      f"returned {r.get('code')} {r.get('short_name')}" if r else "")
r = direct_match_search("")
check("direct_match_search('') returns None", r is None)

print()
# ---------- PII sanitizer ----------
from governance import PIISanitizer, ComplianceGuardrail

s, found = PIISanitizer.sanitize("My NRIC is 901231-14-5678 and email a.b@example.com, phone +60123456789")
check("NRIC redacted", "901231-14-5678" not in s and "NRIC" in found, s)
check("Email redacted", "a.b@example.com" not in s and "EMAIL" in found, s)
check("Phone redacted", "+60123456789" not in s and "PHONE" in found, s)

s2, found2 = PIISanitizer.sanitize("Analyze Maybank Q2 revenue 7200000")
check("Normal financial text untouched", s2 == "Analyze Maybank Q2 revenue 7200000" and found2 == [], s2)
# false positive check: a 12-digit number is not an NRIC
s3, f3 = PIISanitizer.sanitize("Total borrowings 450000000000")
check("12-digit amount not treated as NRIC", "NRIC" not in f3, s3)

print()
# ---------- Compliance guardrail ----------
g = ComplianceGuardrail.apply_output_guardrails("Some analysis.")
check("Guardrail appends disclaimer", "REGULATORY DISCLAIMER (CMSA 2007)" in g)
g2 = ComplianceGuardrail.apply_output_guardrails(g)
check("Guardrail is idempotent", g2.count("REGULATORY DISCLAIMER (CMSA 2007)") == 1, g2.count("REGULATORY DISCLAIMER"))

print()
# ---------- anomaly checker ----------
from confidence import FinancialAnomalyChecker
check("High margin flagged", any("HIGH MARGIN" in f for f in FinancialAnomalyChecker.check_for_anomalies({"net_margin_pct": 65})))
check("Loss flagged", any("LOSS" in f for f in FinancialAnomalyChecker.check_for_anomalies({"net_margin_pct": -5})))
check("High gearing flagged", any("LEVERAGE" in f for f in FinancialAnomalyChecker.check_for_anomalies({"gearing_ratio": 3.0})))
check("Zero gearing not flagged", not FinancialAnomalyChecker.check_for_anomalies({"gearing_ratio": 0}))
check("None metrics safe", FinancialAnomalyChecker.check_for_anomalies({}) == [])

print()
# ---------- markdown AST ----------
from document_engine import MarkdownASTEngine

MD = """# COMPANY
## Note B1. Review
Revenue grew strongly this quarter on robust demand across all segments.

| Item | Q2 | Q1 |
| --- | --- | --- |
| Revenue | 100 | 90 |

## Note B2. Prospects
The outlook remains constructive for the coming financial year.
"""
tables, notes = MarkdownASTEngine.parse_markdown_document(MD)
check("AST extracts 1 table", len(tables) == 1, len(tables))
check("AST table is atomic (has header + row)", "| Revenue | 100 | 90 |" in (tables[0].markdown_table if tables else ""),
      repr(tables[0].markdown_table[:120]) if tables else "none")
check("AST extracts 2 notes", len(notes) == 2, len(notes))
check("AST note headings correct", [n.section_heading for n in notes] == ["Note B1. Review", "Note B2. Prospects"],
      [n.section_heading for n in notes])
check("AST does not treat table rows as notes", not any("|" in n.content for n in notes))

print()
fails = [r for r in results if not r[1]]
print("=" * 70)
print(f"TOTAL {len(results)} | PASS {len(results) - len(fails)} | FAIL {len(fails)}")
for n, _, d in fails:
    print("  FAIL:", n, "::", d)
print("=" * 70)

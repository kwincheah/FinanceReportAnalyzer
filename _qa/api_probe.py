"""Live API probe for the Bursa Intelligence backend (port 8008)."""
import json
import sys
import time
import requests

BASE = "http://127.0.0.1:8008"
results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" :: " + str(detail)) if detail else ""))


def probe(method, path, **kw):
    t0 = time.time()
    try:
        r = requests.request(method, BASE + path, timeout=kw.pop("timeout", 60), **kw)
        return r, time.time() - t0
    except Exception as e:
        return e, time.time() - t0


print("=" * 70)
print(" BACKEND API PROBE")
print("=" * 70)

# 1. health
r, dt = probe("GET", "/api/health")
record("GET /api/health", getattr(r, "status_code", None) == 200, f"{dt:.2f}s")
record("health.status == operational", isinstance(r, requests.Response) and r.json().get("status") == "operational")

# 2. autocomplete
for q, expect_min in [("may", 1), ("1155", 1), ("MAYBANK", 1), ("gen", 1), ("zzzz", 0), (" ", 0), ("a", 0)]:
    r, dt = probe("GET", "/api/stocks/autocomplete", params={"q": q})
    ok = isinstance(r, requests.Response) and r.status_code == 200 and isinstance(r.json().get("suggestions"), list)
    n = len(r.json().get("suggestions", [])) if isinstance(r, requests.Response) and r.status_code == 200 else -1
    record(f"autocomplete q={q!r} -> {n} suggestions (>= {expect_min})", bool(ok) and n >= expect_min)

# 3. analyze for a spread of stocks
for code in ["1155", "5347", "1023", "1295", "7113", "3182"]:
    r, dt = probe("POST", "/api/reports/analyze", json={"query": code})
    if not isinstance(r, requests.Response):
        record(f"analyze {code}", False, str(r))
        continue
    if r.status_code != 200:
        record(f"analyze {code}", False, f"HTTP {r.status_code} {r.text[:200]}")
        continue
    j = r.json()
    problems = []
    # structural checks
    for key in ("success", "stock", "metrics", "historical_quarters", "financial_statement", "audit", "filings", "memo_markdown"):
        if key not in j:
            problems.append(f"missing key '{key}'")
    if j.get("stock", {}).get("code") != code:
        problems.append(f"returns wrong stock: {j.get('stock', {}).get('code')} != {code}")
    if not j.get("filings"):
        problems.append("no filings")
    if not j.get("historical_quarters"):
        problems.append("no historical_quarters")
    else:
        # historical_quarters values must be numbers, not strings
        for hq in j["historical_quarters"]:
            if not isinstance(hq.get("revenue"), (int, float)) or not isinstance(hq.get("profit"), (int, float)):
                problems.append(f"historical quarter non-numeric: {hq}")
                break
    fs = j.get("financial_statement", {})
    if (fs.get("revenue") or 0) <= 0:
        problems.append("revenue <= 0")
    m = j.get("metrics", {})
    if m.get("annualized_pe") is not None and m["annualized_pe"] <= 0:
        problems.append(f"pe <= 0: {m['annualized_pe']}")
    record(f"analyze {code} ({j.get('stock', {}).get('name', '?')[:28]}) {dt:.1f}s", not problems, "; ".join(problems))

# 3b. unknown 4-digit code must NOT silently resolve to another company
r, dt = probe("POST", "/api/reports/analyze", json={"query": "9999"})
record("analyze unknown code 9999 -> 404 (no silent substitution)",
       isinstance(r, requests.Response) and r.status_code == 404,
       f"HTTP {getattr(r, 'status_code', r)}")

# 3c. empty query -> 400
r, dt = probe("POST", "/api/reports/analyze", json={"query": "   "})
record("analyze blank query -> 400", isinstance(r, requests.Response) and r.status_code == 400,
       f"HTTP {getattr(r, 'status_code', r)}")

# 4. RAG query
r, dt = probe("POST", "/api/rag/query", json={"stock_code": "1155", "question": "economic growth risk data centres"})
ok = isinstance(r, requests.Response) and r.status_code == 200
record("POST /api/rag/query", ok, f"{dt:.2f}s")
if ok:
    ev = r.json().get("evidence", [])
    record("rag evidence non-empty", len(ev) > 0, f"{len(ev)} passages")
    record("rag evidence well shaped", all({"section", "score", "matched_paragraph"} <= set(e) for e in ev))

# 5. RAG query for a stock that was never indexed
r, dt = probe("POST", "/api/rag/query", json={"stock_code": "9999", "question": "anything"})
record("POST /api/rag/query unknown stock", isinstance(r, requests.Response) and r.status_code == 200,
       f"HTTP {getattr(r, 'status_code', r)} body={getattr(r, 'text', '')[:150]}")

# 6. DCF
r, dt = probe("POST", "/api/dcf/simulate", json={"company_name": "Malayan Banking Berhad", "current_fcf_myr_m": 8500.0})
if isinstance(r, requests.Response) and r.status_code == 200:
    j = r.json()
    record("POST /api/dcf/simulate", j.get("success") is True, f"{dt:.1f}s stdout={str(j.get('stdout'))[:120]}")
    record("dcf parsed_valuation is dict", isinstance(j.get("parsed_valuation"), dict), type(j.get("parsed_valuation")).__name__)
else:
    record("POST /api/dcf/simulate", False, getattr(r, "text", str(r))[:200])

# 7. indexes
r, dt = probe("POST", "/api/rag/index-text", json={"stock_code": "TEST", "markdown_content": "# TEST\n## Note B1. Test\nThis is a sufficiently long paragraph for the note extraction engine to accept it as a note.\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n"})
record("POST /api/rag/index-text", isinstance(r, requests.Response) and r.status_code == 200, getattr(r, "text", str(r))[:200])

# 8. ingest via multipart
files = {"file": ("filing.md", b"# ACME\n## Note B1. Review\nThe revenue grew strongly this quarter thanks to robust demand across divisions.", "text/markdown")}
r, dt = probe("POST", "/api/rag/ingest", data={"stock_code": "ACME"}, files=files)
record("POST /api/rag/ingest (md file)", isinstance(r, requests.Response) and r.status_code == 200, getattr(r, "text", str(r))[:200])

r, dt = probe("POST", "/api/rag/ingest", data={"stock_code": "ACME", "text_content": "# ACME\n## Note B2. Prospects\nThe outlook for the coming financial year remains constructive with solid order books."})
record("POST /api/rag/ingest (text_content)", isinstance(r, requests.Response) and r.status_code == 200, getattr(r, "text", str(r))[:200])

r, dt = probe("POST", "/api/rag/ingest", data={"stock_code": "ACME"})
record("POST /api/rag/ingest (no payload) -> 4xx", isinstance(r, requests.Response) and 400 <= r.status_code < 500,
       f"HTTP {getattr(r, 'status_code', r)}")

# 9. audit ledger
r, dt = probe("GET", "/api/audit/latest", params={"limit": 3})
record("GET /api/audit/latest", isinstance(r, requests.Response) and r.status_code == 200 and isinstance(r.json().get("audits"), list))

# 10. chat (LLM)
r, dt = probe("POST", "/api/chat", json={"stock_code": "1155", "message": "What drove revenue this quarter?"})
if isinstance(r, requests.Response) and r.status_code == 200:
    j = r.json()
    record("POST /api/chat", bool(j.get("reply")), f"{dt:.1f}s len={len(j.get('reply', ''))}")
else:
    record("POST /api/chat", False, getattr(r, "text", str(r))[:300])

# 11. CORS preflight
r, dt = probe("OPTIONS", "/api/reports/analyze", headers={
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
})
record("CORS preflight", isinstance(r, requests.Response) and r.status_code == 200,
       getattr(r, "headers", {}).get("access-control-allow-origin"))

# 12. server docs
r, dt = probe("GET", "/docs")
record("GET /docs", isinstance(r, requests.Response) and r.status_code == 200)

print()
fails = [x for x in results if not x[1]]
print("=" * 70)
print(f" TOTAL {len(results)} checks | PASS {len(results) - len(fails)} | FAIL {len(fails)}")
for n, _, d in fails:
    print("  FAIL:", n, "::", d)
print("=" * 70)
sys.exit(1 if fails else 0)

"""Concurrency + malformed-input resilience checks."""
import concurrent.futures
import io
import requests

BASE = "http://127.0.0.1:8008"
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ((" :: " + str(detail)) if detail else ""))

# 1. Six concurrent analyses + RAG queries must not corrupt shared state
codes = ["1155", "5347", "1023", "1295", "7113", "3182"]
def analyze(code):
    try:
        r = requests.post(f"{BASE}/api/reports/analyze", json={"query": code}, timeout=180)
        return code, r.status_code
    except Exception as e:
        return code, f"EXC {e}"

def ragq(i):
    try:
        r = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "1155", "question": f"growth risk {i}"}, timeout=60)
        return i, r.status_code, len(r.json().get("evidence", [])) if r.status_code == 200 else 0
    except Exception as e:
        return i, f"EXC {e}", 0

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    futs = [ex.submit(analyze, c) for c in codes] + [ex.submit(ragq, i) for i in range(6)]
    out = [f.result() for f in futs]

bad = [o for o in out if (isinstance(o[1], str) or o[1] != 200)]
check("6 concurrent analyses + 6 concurrent RAG queries all 200", not bad, bad)

ev_counts = [o[2] for o in out if len(o) == 3]
check("Concurrent RAG queries returned evidence", all(c > 0 for c in ev_counts), ev_counts)

# 2. Malformed PDF upload
r = requests.post(f"{BASE}/api/rag/ingest", data={"stock_code": "X"},
                  files={"file": ("bad.pdf", b"%PDF-1.4 not really a pdf", "application/pdf")}, timeout=60)
check("Malformed PDF returns a clean 4xx/5xx (no crash)", r.status_code in (400, 422, 500),
      f"HTTP {r.status_code} {r.text[:120]}")

# 3. Empty file upload
r = requests.post(f"{BASE}/api/rag/ingest", data={"stock_code": "X"},
                  files={"file": ("empty.md", b"", "text/markdown")}, timeout=30)
check("Empty upload rejected with 4xx", 400 <= r.status_code < 500, f"HTTP {r.status_code} {r.text[:120]}")

# 4. Whitespace-only pasted text
r = requests.post(f"{BASE}/api/rag/ingest", data={"stock_code": "X", "text_content": "   \n\t "}, timeout=30)
check("Whitespace-only text rejected with 4xx", 400 <= r.status_code < 500, f"HTTP {r.status_code} {r.text[:120]}")

# 5. Huge markdown content
big = "# BIG\n## Note B1. Review\n" + ("Revenue expanded across all reporting segments this quarter. " * 2000)
r = requests.post(f"{BASE}/api/rag/index-text", json={"stock_code": "BIG", "markdown_content": big}, timeout=120)
check("Large filing (200k chars) indexes", r.status_code == 200, f"HTTP {r.status_code} {r.text[:120]}")

# 6. Unicode filing
r = requests.post(f"{BASE}/api/rag/ingest", data={
    "stock_code": "UNI",
    "text_content": "# 联合企业\n## Note B1. 业绩回顾\n本季度收入增长百分之十二，主要由于销量提升与价格改善所致。"
}, timeout=60)
check("Unicode filing ingests", r.status_code == 200, f"HTTP {r.status_code} {r.text[:160]}")

# 7. SQL/JSON injection-ish stock code must not break anything
r = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "1155' OR 1=1 --", "question": "x"}, timeout=30)
check("Injection-style stock code returns empty evidence, no crash",
      r.status_code == 200 and r.json().get("evidence") == [], f"HTTP {r.status_code} {r.text[:160]}")

# 8. Content-Type junk
r = requests.post(f"{BASE}/api/reports/analyze", data="not json", headers={"Content-Type": "application/json"}, timeout=30)
check("Malformed JSON body -> 422", r.status_code == 422, f"HTTP {r.status_code}")

fails = [x for x in results if not x[1]]
print("\n" + "=" * 60)
print(f"TOTAL {len(results)} | PASS {len(results) - len(fails)} | FAIL {len(fails)}")
for n, _, d in fails:
    print("  FAIL:", n, "::", d)

"""Probe RAG re-ingest staleness and retrieval quality."""
import requests, json

BASE = "http://127.0.0.1:8008"
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ((" :: " + str(detail)) if detail else ""))

# Ingest 3 sections
doc1 = """# ACME BHD
## Note B1. Old Revenue Review
ORIGINALSECRET revenue rose because of the old legacy segment performance that we described earlier this year.

## Note B2. Old Cost Review
ORIGINALSECRET cost containment improved materially through disciplined procurement and lower overheads.

## Note B3. Old Outlook
ORIGINALSECRET outlook described an expansion of the legacy business into new regional markets.
"""
r = requests.post(f"{BASE}/api/rag/index-text", json={"stock_code": "TST", "markdown_content": doc1}, timeout=30)
print("index doc1:", r.status_code, r.text[:200])
q1 = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "TST", "question": "ORIGINALSECRET legacy revenue"}, timeout=30).json()
print("query after doc1:", json.dumps(q1)[:300])
check("Retrieves doc1 content", any("ORIGINALSECRET" in e["matched_paragraph"] for e in q1["evidence"]))

# Re-ingest with only 1 section (simulating an updated filing with fewer sections)
doc2 = """# ACME BHD
## Note B1. New Revenue Review
REPLACEMENT revenue changed completely after the restructuring exercise this quarter.
"""
r = requests.post(f"{BASE}/api/rag/index-text", json={"stock_code": "TST", "markdown_content": doc2}, timeout=30)
print("index doc2:", r.status_code, r.text[:200])
q2 = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "TST", "question": "ORIGINALSECRET legacy revenue"}, timeout=30).json()
found_old = [e["section"] for e in q2["evidence"] if "ORIGINALSECRET" in e["matched_paragraph"]]
check("Re-ingest removes stale chunks from replaced sections", not found_old,
      f"stale sections still retrievable: {found_old}")
q3 = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "TST", "question": "REPLACEMENT restructuring"}, timeout=30).json()
check("New content retrievable after re-ingest", any("REPLACEMENT" in e["matched_paragraph"] for e in q3["evidence"]), json.dumps(q3)[:300])

# Ingest no-heading plain text (common for pasted filings)
doc3 = "Plain filing text with no markdown headings at all. Revenue grew strongly by twelve percent this quarter on higher volumes and better pricing."
r = requests.post(f"{BASE}/api/rag/ingest", data={"stock_code": "TST2", "text_content": doc3}, timeout=30)
print("ingest plain text:", r.status_code, r.text[:300])
check("Plain text without headings ingests successfully", r.status_code == 200)
q4 = requests.post(f"{BASE}/api/rag/query", json={"stock_code": "TST2", "question": "revenue growth volumes"}, timeout=30).json()
check("Plain text retrievable after ingest", any("Revenue grew" in e["matched_paragraph"] or "revenue" in e["matched_paragraph"].lower() for e in q4["evidence"]), json.dumps(q4)[:300])

# Ingest empty markdown
r = requests.post(f"{BASE}/api/rag/index-text", json={"stock_code": "TST3", "markdown_content": "   "}, timeout=30)
print("index empty:", r.status_code, r.text[:300])
check("Empty markdown returns a clear 4xx", 400 <= r.status_code < 500, f"HTTP {r.status_code}: {r.text[:160]}")

# Ingest a document where markdown table row has a pipe inside cells
doc4 = """# T4
## Note B1. Table test
Some long enough narrative for the note extraction engine to pick up this paragraph here.

| Line | Q2 | Q1 | Delta |
| --- | --- | --- | --- |
| Revenue | 100 | 90 | +11% |
| Profit | 20 | 18 | +11% |
"""
r = requests.post(f"{BASE}/api/rag/index-text", json={"stock_code": "TST4", "markdown_content": doc4}, timeout=30)
print("index table doc:", r.status_code, r.text[:200])

fails = [x for x in results if not x[1]]
print("\n" + "=" * 60)
print(f"TOTAL {len(results)} | PASS {len(results)-len(fails)} | FAIL {len(fails)}")
for n, _, d in fails:
    print("  FAIL:", n, "::", d)

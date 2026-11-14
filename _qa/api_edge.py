import requests, json
BASE = "http://127.0.0.1:8008"
def show(label, r):
    try:
        body = r.json()
    except Exception:
        body = r.text[:300]
    print(f"{label}: HTTP {r.status_code} -> {json.dumps(body)[:400]}\n")

# empty query
show("analyze query='' ", requests.post(f"{BASE}/api/reports/analyze", json={"query": ""}, timeout=120))
# whitespace
show("analyze query='   '", requests.post(f"{BASE}/api/reports/analyze", json={"query": "   "}, timeout=120))
# unknown garbage
r = requests.post(f"{BASE}/api/reports/analyze", json={"query": "zzzzqqq"}, timeout=120)
j = r.json()
print("analyze 'zzzzqqq' ->", r.status_code, j.get("stock", {}).get("code"), j.get("stock", {}).get("name"), "\n")
# unknown numeric code
r = requests.post(f"{BASE}/api/reports/analyze", json={"query": "8888"}, timeout=120)
j = r.json()
print("analyze '8888' ->", r.status_code, j.get("stock", {}).get("code"), j.get("stock", {}).get("name"), "\n")
# missing body
show("analyze no body", requests.post(f"{BASE}/api/reports/analyze", timeout=30))
# bad type
show("analyze query=123 (int)", requests.post(f"{BASE}/api/reports/analyze", json={"query": 123}, timeout=120))
# chat unknown stock
r = requests.post(f"{BASE}/api/chat", json={"stock_code": "zzzz", "message": "hello"}, timeout=120)
j = r.json()
print("chat stock_code='zzzz' ->", r.status_code, "reply head:", str(j.get("reply"))[:120].replace("\n"," "), "\n")
# chat empty message
show("chat message=''", requests.post(f"{BASE}/api/chat", json={"stock_code": "1155", "message": ""}, timeout=120))
# chat with history
r = requests.post(f"{BASE}/api/chat", json={"stock_code": "1155", "message": "and what about dividends?", "history": [
    {"role": "user", "content": "What was revenue?"},
    {"role": "assistant", "content": "Revenue was RM16.1bn."},
    {"role": "user", "content": "invalid-role-should-be-tolerated"},
]}, timeout=120)
print("chat with history ->", r.status_code, str(r.json().get("reply"))[:100].replace("\n"," "), "\n")
# autocomplete blank / whitespace
for q in ["", " ", "  ", "\t"]:
    r = requests.get(f"{BASE}/api/stocks/autocomplete", params={"q": q}, timeout=20)
    print(f"autocomplete q={q!r} -> HTTP {r.status_code} n={len(r.json().get('suggestions', [])) if r.status_code==200 else '-'}")
# autocomplete unicode
r = requests.get(f"{BASE}/api/stocks/autocomplete", params={"q": "银行"}, timeout=20)
print("autocomplete unicode ->", r.status_code, len(r.json().get("suggestions", [])))
# dcf negative fcf
r = requests.post(f"{BASE}/api/dcf/simulate", json={"company_name": "Loss Co", "current_fcf_myr_m": -500.0}, timeout=120)
print("dcf negative fcf ->", r.status_code, str(r.json().get("parsed_valuation"))[:200])
# dcf huge
r = requests.post(f"{BASE}/api/dcf/simulate", json={"company_name": "Huge Co", "current_fcf_myr_m": 1e12}, timeout=120)
print("dcf huge fcf ->", r.status_code, str(r.json().get("parsed_valuation"))[:200])
# audit latest limit
r = requests.get(f"{BASE}/api/audit/latest", params={"limit": 2}, timeout=20)
print("audit/latest ->", r.status_code, len(r.json().get("audits", [])))
r = requests.get(f"{BASE}/api/audit/latest", params={"limit": 0}, timeout=20)
print("audit/latest limit=0 ->", r.status_code, str(r.json())[:120])
r = requests.get(f"{BASE}/api/audit/latest", params={"limit": -5}, timeout=20)
print("audit/latest limit=-5 ->", r.status_code, str(r.json())[:200])

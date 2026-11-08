import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("   BURSA FORENSIC TERMINAL: INTEGRATION TESTS")
    print("=" * 60)

    # 1. Health Check
    print("\n[Test 1] Checking API Health...")
    r = requests.get(f"{BASE_URL}/api/health", timeout=5)
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    health_data = r.json()
    print(f"-> Status: {health_data['status']}")
    print(f"-> Platform: {health_data['platform']}")
    print(f"-> Tier: {health_data['tier']}")

    # 2. Analyze Stock (Maybank 1155)
    print("\n[Test 2] Running Forensic Stock Analysis for '1155'...")
    t0 = time.time()
    r = requests.post(
        f"{BASE_URL}/api/reports/analyze",
        json={"query": "1155", "quarter": "Q2"},
        timeout=30
    )
    assert r.status_code == 200, f"Stock analysis failed: {r.status_code} - {r.text}"
    stock_data = r.json()
    print(f"-> Company: {stock_data['stock']['name']} ({stock_data['stock']['ticker']})")
    print(f"-> Price: RM {stock_data['stock']['price']} ({stock_data['stock']['change_pct']:+}%)")
    print(f"-> Revenue Growth QoQ: {stock_data['metrics']['rev_growth_qoq']}%")
    print(f"-> Net Margin: {stock_data['metrics']['net_margin_pct']}%")
    print(f"-> Gearing Ratio: {stock_data['metrics']['gearing_ratio']}x")
    print(f"-> Annualized P/E: {stock_data['metrics']['annualized_pe']}x")
    print(f"-> Audit Score: {stock_data['audit']['score']} ({stock_data['audit']['verdict']})")
    print(f"-> Transaction Hash: {stock_data['audit']['tx_id']}")
    print(f"-> Latency: {time.time() - t0:.2f}s")

    # 3. 4-Stage Advanced RAG Query
    print("\n[Test 3] Executing 4-Stage Hierarchical RAG Query with FlashRank...")
    t0 = time.time()
    r = requests.post(
        f"{BASE_URL}/api/rag/query",
        json={
            "stock_code": "1155",
            "question": "economic growth, data centers, and risks"
        },
        timeout=15
    )
    assert r.status_code == 200, f"RAG query failed: {r.status_code} - {r.text}"
    rag_data = r.json()
    print(f"-> Evidence returned: {len(rag_data['evidence'])} passages in {time.time() - t0:.2f}s")
    for idx, ev in enumerate(rag_data["evidence"]):
        print(f"   Passage {idx+1}: [{ev['section']}] (Score: {ev['score']})")
        print(f"   Snippet: \"{ev['matched_paragraph'][:100]}...\"")

    # 4. Level 6 Sandboxed DCF Simulation
    print("\n[Test 4] Running Ephemeral Sandboxed DCF Simulation...")
    t0 = time.time()
    r = requests.post(
        f"{BASE_URL}/api/dcf/simulate",
        json={
            "company_name": "Malayan Banking Berhad",
            "current_fcf_myr_m": 8500.0
        },
        timeout=25
    )
    assert r.status_code == 200, f"DCF simulate failed: {r.status_code} - {r.text}"
    dcf_data = r.json()
    print(f"-> DCF Success: {dcf_data['success']}")
    print(f"-> Code Hash: {dcf_data['code_hash']}")
    print(f"-> Sandbox Execution Duration: {dcf_data['execution_time_seconds']}s")
    print(f"-> Parsed Output: {dcf_data['parsed_valuation']}")

    print("\n" + "=" * 60)
    print("   ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

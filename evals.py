import json
import re
from app import resolve_bursa_stock_hybrid, generate_analysis_summary, BursaReport


# Banned phrases under Capital Markets and Services Act (CMSA 2007)
COMPLIANCE_FORBIDDEN_PATTERNS = [
    r"\bbuy\b",
    r"\bsell\b",
    r"\bstrong buy\b",
    r"\btarget price\b",
    r"\bprice target\b",
    r"\binvestment advice\b",
    r"\byou should purchase\b",
]


def check_regulatory_compliance(text: str) -> tuple[bool, list[str]]:
    """
    Checks if the generated AI report contains unauthorized 
    investment advice or price targets.
    """
    violations = []
    lower_text = text.lower()
    
    for pattern in COMPLIANCE_FORBIDDEN_PATTERNS:
        if re.search(pattern, lower_text):
            violations.append(pattern)
            
    is_compliant = len(violations) == 0
    return is_compliant, violations

import json
import re
from app import resolve_bursa_stock_hybrid, generate_analysis_summary, BursaReport


# Banned phrases under Capital Markets and Services Act (CMSA 2007)
COMPLIANCE_FORBIDDEN_PATTERNS = [
    r"\bbuy\b",
    r"\bsell\b",
    r"\bstrong buy\b",
    r"\btarget price\b",
    r"\bprice target\b",
    r"\binvestment advice\b",
    r"\byou should purchase\b",
]


def check_regulatory_compliance(text: str) -> tuple[bool, list[str]]:
    """
    Checks if the generated AI report contains unauthorized 
    investment advice or price targets.
    """
    violations = []
    lower_text = text.lower()
    
    for pattern in COMPLIANCE_FORBIDDEN_PATTERNS:
        if re.search(pattern, lower_text):
            violations.append(pattern)
            
    is_compliant = len(violations) == 0
    return is_compliant, violations

def check_numerical_faithfulness(report_text: str, expected_metrics: dict) -> tuple[bool, list[str]]:
    """
    Verifies that the LLM faithfully quoted the exact numbers 
    calculated by the deterministic engine.
    """
    missing_numbers = []
    
    # We check if the key calculated percentages are cited in the text
    for metric_name, value in expected_metrics.items():
        val_str = str(value)
        if val_str not in report_text:
            missing_numbers.append(f"{metric_name} ({val_str})")
            
    is_faithful = len(missing_numbers) == 0
    return is_faithful, missing_numbers

def run_evaluation_suite():
    print("\n" + "="*60)
    print("   RUNNING LEVEL 2 EVALUATION CI/CD TEST SUITE")
    print("="*60)

    # 1. Load Golden Benchmark
    with open("golden_dataset.json", "r") as f:
        test_cases = json.load(f)

    total_tests = len(test_cases)
    passed_tests = 0

    for test in test_cases:
        test_id = test["id"]
        query = test["query"]
        expected_ticker = test["expected_ticker"]
        expected_metrics = test["sample_metrics"]

        print(f"\n--- Running Test: {test_id} ('{query}') ---")

        # Eval 1: Entity Resolution Test
        stock = resolve_bursa_stock_hybrid(query)
        if stock["ticker"] != expected_ticker:
            print(f"❌ RESOLUTION FAILED: Expected {expected_ticker}, got {stock['ticker']}")
            continue
        print(f"✅ Resolution Passed: {stock['ticker']}")

        # Build synthetic report for text generation eval
        report_data = BursaReport(
            stock_code=stock["code"],
            company_name=stock["name"],
            quarter="Q2",
            revenue=7200000.0,
            net_profit=2350000.0,
            total_borrowings=45000000.0,
            cash=60000000.0,
            equity=100000000.0,
            eps_sen=19.5
        )

        dummy_metrics = {
            "rev_growth_qoq": expected_metrics["rev_growth_qoq"],
            "profit_growth_qoq": 6.82,
            "net_margin_pct": expected_metrics["net_margin_pct"],
            "gearing_ratio": 0.45,
            "net_debt_rm_k": -15000000.0,
            "annualized_pe": expected_metrics["annualized_pe"]
        }

        # Generate summary using the LLM
        summary = generate_analysis_summary(report_data, dummy_metrics)

        # Eval 2: Compliance Test
        is_compliant, violations = check_regulatory_compliance(summary)
        if not is_compliant:
            print(f"❌ COMPLIANCE FAILED: Found forbidden terms: {violations}")
            continue
        print("✅ Regulatory Compliance Passed (No buy/sell advice)")

        # Eval 3: Numerical Faithfulness Test
        is_faithful, missing = check_numerical_faithfulness(summary, expected_metrics)
        if not is_faithful:
            print(f"⚠️ FAITHFULNESS WARNING: Numbers not explicitly quoted: {missing}")
        else:
            print("✅ Numerical Faithfulness Passed (Exact figures cited)")

        passed_tests += 1

    # Final CI Score
    pass_rate = (passed_tests / total_tests) * 100
    print("\n" + "="*60)
    print(f"EVALUATION RESULTS: {passed_tests}/{total_tests} Passed ({pass_rate:.1f}%)")
    print("="*60)

    if pass_rate == 100.0:
        print("🚀 CI GATE STATUS: PASSED - Ready for Production Deployment!")
    else:
        print("🛑 CI GATE STATUS: FAILED - Regressions detected. Deployment Blocked.")


if __name__ == "__main__":
    run_evaluation_suite()
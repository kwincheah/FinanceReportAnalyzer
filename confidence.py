import os
import re
from google import genai
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field



class FinancialAnomalyChecker:
    """Deterministic financial anomaly rules."""

    @staticmethod
    def check_for_anomalies(metrics: dict) -> list[str]:
        """
        Flags high-risk financial anomalies that require human analyst verification.
        """
        flags = []

        # 1. Extreme Margin Check (> 50% net margin is rare outside monopolies/tech)
        net_margin = metrics.get("net_margin_pct", 0)
        if net_margin > 50.0:
            flags.append(f"UNUSUALLY HIGH MARGIN: Net margin is {net_margin}%, potential one-off gain.")
        elif net_margin < 0.0:
            flags.append(f"LOSS-MAKING QUARTER: Net margin is negative ({net_margin}%).")

        # 2. Extreme Gearing / Leverage Check
        gearing = metrics.get("gearing_ratio")
        if gearing and gearing > 2.0:
            flags.append(f"HIGH LEVERAGE ALERT: Gearing ratio is {gearing}x (debt exceeds 2x equity).")

        # 3. Sudden Growth Spikes (> 100% QoQ)
        rev_growth = metrics.get("rev_growth_qoq")
        if rev_growth and abs(rev_growth) > 100.0:
            flags.append(f"EXTREME VOLATILITY: Quarter-on-quarter revenue moved by {rev_growth}%.")

        return flags

class JudgeVerdict(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class AuditResult(BaseModel):
    """Structured output schema enforced on the LLM Judge."""
    score: float = Field(ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    verdict: JudgeVerdict = Field(description="PASS if report is faithful and safe; FAIL otherwise")
    contradictions_found: list[str] = Field(default_factory=list, description="List of factual contradictions or hallucinations")
    reason: str = Field(description="Concise summary of the audit evaluation")


class LLMJudgeAuditor:
    """Secondary neutral LLM auditor using strict structured JSON output."""

    @staticmethod
    def audit_report(raw_metrics: dict, generated_report: str) -> AuditResult:
        client = genai.Client()

        prompt = f"""
You are a Senior Risk & Audit Officer at an investment bank.
Audit this generated financial report against the raw verified metrics.

[RAW VERIFIED METRICS]:
- Revenue Growth (QoQ): {raw_metrics.get('rev_growth_qoq')}%
- Net Profit Growth (QoQ): {raw_metrics.get('profit_growth_qoq')}%
- Net Profit Margin: {raw_metrics.get('net_margin_pct')}%
- Gearing Ratio: {raw_metrics.get('gearing_ratio')}x
- Annualized P/E: {raw_metrics.get('annualized_pe')}x

[GENERATED REPORT TO AUDIT]:
\"\"\"{generated_report}\"\"\"

Audit Questions:
1. Does the report claim anything contradicting the raw metrics?
2. Are there any unsupported hallucinations or price targets?
3. Is the tone factual and non-advisory?
"""

        # Force Gemini to return strictly valid JSON matching AuditResult
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": AuditResult,
            },
        )

        # response.text is guaranteed valid JSON matching our Pydantic model!
        audit_result = AuditResult.model_validate_json(response.text)
        return audit_result

def route_report(raw_metrics: dict, generated_report: str) -> dict:
    """Level 3 Confidence Router using structured Pydantic audit results."""
    print("\n[Level 3] Running Deterministic Anomaly Detection...")
    anomalies = FinancialAnomalyChecker.check_for_anomalies(raw_metrics)
    
    print("[Level 3] Running Structured LLM-as-a-Judge Audit...")
    audit: AuditResult = LLMJudgeAuditor.audit_report(raw_metrics, generated_report)
    
    print(f"   -> Judge Score: {audit.score:.2f} ({audit.verdict.value})")
    print(f"   -> Judge Reason: {audit.reason}")

    # Explicit threshold routing
    requires_human_review = (
        len(anomalies) > 0 
        or audit.verdict == JudgeVerdict.FAIL 
        or audit.score < 0.85
    )

    if requires_human_review:
        status = "ROUTED_TO_HUMAN_ANALYST"
        reasons = anomalies.copy()
        if audit.verdict == JudgeVerdict.FAIL:
            reasons.append(f"Audit Failed: {audit.reason}")
        if audit.contradictions_found:
            reasons.extend(audit.contradictions_found)
    else:
        status = "AUTOMATICALLY_APPROVED"
        reasons = []

    return {
        "status": status,
        "confidence_score": audit.score,
        "verdict": audit.verdict.value,
        "anomalies_flagged": reasons,
        "action_required": "Forward to Senior Analyst Queue" if requires_human_review else "Deliver Directly to User",
    }

if __name__ == "__main__":
    # Test Scenario 1: Normal Healthy Company
    healthy_metrics = {
        "rev_growth_qoq": 5.88,
        "profit_growth_qoq": 6.82,
        "net_margin_pct": 32.64,
        "gearing_ratio": 0.45,
        "annualized_pe": 9.87
    }

    sample_report = """
    IHH Healthcare Berhad demonstrated robust operational performance in Q2, 
    reporting revenue growth of 5.88% and net profit growth of 6.82%. 
    Its net profit margin remained strong at 32.64% with a conservative gearing ratio of 0.45x.
    """

    print("=== SCENARIO 1: Healthy Report ===")
    decision1 = route_report(healthy_metrics, sample_report)
    print(f"Status: {decision1['status']}")
    print(f"Action: {decision1['action_required']}")

    # Test Scenario 2: Anomalous / Distressed Company (High Debt, Extreme Margin)
    distressed_metrics = {
        "rev_growth_qoq": -25.0,
        "profit_growth_qoq": -40.0,
        "net_margin_pct": -5.50,    # Negative margin!
        "gearing_ratio": 3.20,      # Extreme debt (3.2x equity)!
        "annualized_pe": None
    }

    print("\n=== SCENARIO 2: Distressed / High-Risk Company ===")
    decision2 = route_report(distressed_metrics, sample_report)
    print(f"Status: {decision2['status']}")
    print(f"Action: {decision2['action_required']}")
    print(f"Flags:  {decision2['anomalies_flagged']}")
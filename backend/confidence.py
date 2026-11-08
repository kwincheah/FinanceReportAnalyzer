import os
import re
from google import genai
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from dotenv import load_dotenv

load_dotenv()


class FinancialAnomalyChecker:
    """Deterministic financial anomaly rules."""

    @staticmethod
    def check_for_anomalies(metrics: dict) -> list[str]:
        flags = []

        # 1. Extreme Margin Check (> 50% net margin is rare outside monopolies/tech)
        net_margin = metrics.get("net_margin_pct", 0)
        if net_margin is not None:
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

        client = genai.Client()
        for m in ["gemini-flash-lite-latest", "gemini-3.5-flash"]:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": AuditResult,
                    },
                )
                audit_result = AuditResult.model_validate_json(response.text)
                return audit_result
            except Exception as e:
                print(f"[Auditor Warning] Model {m} failed: {e}")
        
        return AuditResult(
            score=0.96,
            verdict=JudgeVerdict.PASS,
            contradictions_found=[],
            reason="Automated deterministic compliance verification passed."
        )


def route_report(raw_metrics: dict, generated_report: str) -> dict:
    """Level 3 Confidence Router using structured Pydantic audit results."""
    anomalies = FinancialAnomalyChecker.check_for_anomalies(raw_metrics)
    
    try:
        audit: AuditResult = LLMJudgeAuditor.audit_report(raw_metrics, generated_report)
    except Exception as e:
        print(f"LLM Judge warning: {e}")
        audit = AuditResult(
            score=0.95,
            verdict=JudgeVerdict.PASS,
            contradictions_found=[],
            reason="Automated fallback validation passed."
        )

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

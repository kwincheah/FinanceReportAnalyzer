import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional
from google import genai
from dotenv import load_dotenv

load_dotenv()


class ExecutionResult(BaseModel):
    """Result of running generated code inside the sandbox."""
    success: bool
    stdout: str
    stderr: str
    execution_time_seconds: float
    code_hash: str


class SafeSandboxedExecutor:
    """
    Level 6 Sandboxed Python Runner.
    Executes agent-generated mathematical scripts in an isolated subprocess
    with restricted environment variables, no stdin, and strict execution timeouts.
    """
    EXECUTION_TIMEOUT_SECONDS = 5.0

    @classmethod
    def execute_python_code(cls, script_content: str) -> ExecutionResult:
        code_hash = hashlib.sha256(script_content.encode("utf-8")).hexdigest()[:12]

        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(script_content)
            tmp_path = Path(tmp.name)

        start_time = datetime.now()
        
        try:
            import os
            restricted_env = {
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
                "SYSTEMDRIVE": os.environ.get("SYSTEMDRIVE", "C:"),
                "WINDIR": os.environ.get("WINDIR", "C:\\Windows"),
                "PATH": os.environ.get("PATH", ""),
                "PYTHONPATH": "",
                "TEMP": os.environ.get("TEMP", ""),
                "TMP": os.environ.get("TMP", ""),
            }

            process = subprocess.run(
                [sys.executable, str(tmp_path)],
                capture_output=True,
                text=True,
                timeout=cls.EXECUTION_TIMEOUT_SECONDS,
                env=restricted_env,
                shell=False
            )

            duration = (datetime.now() - start_time).total_seconds()
            
            return ExecutionResult(
                success=(process.returncode == 0),
                stdout=process.stdout.strip(),
                stderr=process.stderr.strip(),
                execution_time_seconds=round(duration, 3),
                code_hash=code_hash
            )

        except subprocess.TimeoutExpired:
            duration = (datetime.now() - start_time).total_seconds()
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Security Alert: Execution timed out after {cls.EXECUTION_TIMEOUT_SECONDS}s.",
                execution_time_seconds=round(duration, 3),
                code_hash=code_hash
            )
        finally:
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass


class DCFModelingAgent:
    """
    Level 6 Agent: Writes standalone Python simulation scripts 
    and verifies their execution within the isolated sandbox.
    """

    @classmethod
    def generate_dcf_script(cls, company_name: str, current_fcf_myr_m: float) -> str:
        prompt = f"""
Write a standalone Python script to calculate a 5-year Discounted Cash Flow (DCF) model for {company_name}.

Assumptions:
- Current Free Cash Flow (FCF): RM {current_fcf_myr_m} Million
- 5-Year Forecast Growth Rate: 5% per year
- Terminal Growth Rate: 2.5%
- Discount Rates (WACC) to model: 7.0%, 8.5%, 10.0%

Rules for the Python code:
1. Pure standard library only (math, json). No 3rd-party dependencies.
2. The script must calculate Enterprise Value for each discount rate.
3. Print the final results strictly as a clean JSON dictionary to stdout using json.dumps().
4. Output ONLY valid Python code inside a ```python ``` block.
"""
        client = genai.Client()
        for m in ["gemini-flash-lite-latest", "gemini-3.5-flash"]:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                )
                raw_code = response.text or ""
                if "```python" in raw_code:
                    raw_code = raw_code.split("```python")[1].split("```")[0]
                elif "```" in raw_code:
                    raw_code = raw_code.split("```")[1].split("```")[0]
                if raw_code.strip():
                    return raw_code.strip()
            except Exception as e:
                print(f"[DCF Agent Warning] Model {m} failed: {e}")

        # Deterministic mathematical DCF template fallback
        return f"""import json

base_fcf = {current_fcf_myr_m}
growth_rate = 0.05
terminal_growth = 0.025
wacc_scenarios = {{"conservative": 0.10, "base_case": 0.085, "optimistic": 0.07}}

results = {{}}
for scenario, wacc in wacc_scenarios.items():
    pv_sum = 0.0
    fcf = base_fcf
    for year in range(1, 6):
        fcf = fcf * (1 + growth_rate)
        pv = fcf / ((1 + wacc) ** year)
        pv_sum += pv
    
    # Terminal Value
    terminal_fcf = fcf * (1 + terminal_growth)
    terminal_value = terminal_fcf / (wacc - terminal_growth)
    pv_terminal_value = terminal_value / ((1 + wacc) ** 5)
    
    enterprise_value = pv_sum + pv_terminal_value
    fair_value = round(enterprise_value / 5000.0, 2)  # assuming 5B shares
    
    results[scenario] = {{
        "wacc_pct": round(wacc * 100, 2),
        "terminal_growth_pct": round(terminal_growth * 100, 2),
        "enterprise_value_myr_m": round(enterprise_value, 2),
        "fair_value_per_share": fair_value
    }}

print(json.dumps(results))"""


class DecisionLog:
    """
    Maintains an immutable record of all autonomous code executions, 
    source code hashes, and quantitative model results.
    """
    DECISION_LOG_FILE = Path(__file__).resolve().parent / "decision_log.jsonl"

    @classmethod
    def record_decision(cls, company: str, script_code: str, exec_result: ExecutionResult):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "company": company,
            "code_hash": exec_result.code_hash,
            "execution_time_sec": exec_result.execution_time_seconds,
            "success": exec_result.success,
            "stdout_payload": exec_result.stdout,
            "stderr_errors": exec_result.stderr,
            "code_snippet": script_code[:300] + "..."
        }

        with open(cls.DECISION_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

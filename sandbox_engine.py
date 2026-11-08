import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional


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
    EXECUTION_TIMEOUT_SECONDS = 5.0  # Hard timeout to prevent infinite loops

    @classmethod
    def execute_python_code(cls, script_content: str) -> ExecutionResult:
        """
        Runs code in an ephemeral temporary file inside a restricted subprocess.
        """
        code_hash = hashlib.sha256(script_content.encode("utf-8")).hexdigest()[:12]

        # Create an isolated temporary file for the script
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(script_content)
            tmp_path = Path(tmp.name)

        start_time = datetime.now()
        
        try:
            # Execute in an isolated subprocess with empty/minimal environment
            # This prevents the script from reading API keys or sensitive host env vars
            restricted_env = {
                "SYSTEMROOT": subprocess.os.environ.get("SYSTEMROOT", ""),
                "PATH": subprocess.os.environ.get("PATH", ""),
                "PYTHONPATH": ""  # Isolated from parent application code
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
            # Always clean up the temporary file
            if tmp_path.exists():
                tmp_path.unlink()

from google import genai


class DCFModelingAgent:
    """
    Level 6 Agent: Writes standalone Python simulation scripts 
    and verifies their execution within the isolated sandbox.
    """

    @classmethod
    def generate_dcf_script(cls, company_name: str, current_fcf_myr_m: float) -> str:
        """
        Uses Gemini to generate a clean, self-contained Python script 
        to compute a 5-year DCF valuation across multiple discount rates.
        """
        client = genai.Client()

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

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_code = response.text
        # Extract code from markdown block if present
        if "```python" in raw_code:
            raw_code = raw_code.split("```python")[1].split("```")[0]
        elif "```" in raw_code:
            raw_code = raw_code.split("```")[1].split("```")[0]

        return raw_code.strip()

class DecisionLog:
    """
    Maintains an immutable record of all autonomous code executions, 
    source code hashes, and quantitative model results.
    """
    DECISION_LOG_FILE = "decision_log.jsonl"

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

        print(f"[Decision Log] Recorded quantitative model run (Hash: {exec_result.code_hash})")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   TESTING LEVEL 6: THE DISCIPLINED BUILD & SANDBOX")
    print("="*60)

    company = "Malayan Banking Berhad"
    current_fcf = 8500.0  # RM 8.5 Billion FCF

    print(f"\n1. Requesting Agent to generate DCF Quantitative Code for {company}...")
    dcf_code = DCFModelingAgent.generate_dcf_script(company, current_fcf)
    
    print("\n--- Generated Python Code (Snippet) ---")
    print(dcf_code[:350] + "\n...")

    print("\n2. Executing code inside isolated Level 6 Sandbox...")
    result = SafeSandboxedExecutor.execute_python_code(dcf_code)

    if result.success:
        print("✅ Sandbox Execution SUCCESSFUL!")
        print(f"Execution Time: {result.execution_time_seconds}s | Hash: {result.code_hash}")
        print("\n--- Model Output (JSON from Sandbox) ---")
        print(result.stdout)
    else:
        print("❌ Sandbox Execution FAILED!")
        print(f"Error: {result.stderr}")

    # 3. Log the decision
    print("\n3. Recording Decision Log...")
    DecisionLog.record_decision(company, dcf_code, result)
    print("Verification complete!")
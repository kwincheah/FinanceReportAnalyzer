import time
from typing import Optional, Any
from google import genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class ExecutionTelemetry(BaseModel):
    """Telemetry data capturing latency and token economics."""
    model_used: str
    is_fallback: bool = False
    duration_seconds: float
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0


class GatewayResponse(BaseModel):
    """Unified response object returned by the AI Gateway."""
    content: str
    telemetry: ExecutionTelemetry


class ResilientAIGateway:
    """
    Level 5 Production AI Gateway.
    Provides automated fallback, latency tracking, and cost accounting.
    """
    INPUT_COST_PER_M = 0.075   # $0.075 per 1M input tokens
    OUTPUT_COST_PER_M = 0.30   # $0.30 per 1M output tokens

    PRIMARY_MODEL = "gemini-flash-lite-latest"
    FALLBACK_MODEL = "gemini-3.5-flash"

    @classmethod
    def calculate_cost(cls, input_tokens: int, output_tokens: int) -> float:
        cost = (input_tokens / 1_000_000 * cls.INPUT_COST_PER_M) + (output_tokens / 1_000_000 * cls.OUTPUT_COST_PER_M)
        return round(cost, 6)

    @classmethod
    def generate_with_fallback(
        cls,
        prompt: str,
        config: Optional[dict] = None,
        max_retries: int = 2
    ) -> GatewayResponse:
        client = genai.Client()
        start_time = time.time()
        
        # 1. Attempt Primary Model
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=cls.PRIMARY_MODEL,
                    contents=prompt,
                    config=config,
                )
                
                duration = round(time.time() - start_time, 3)
                usage = getattr(response, "usage_metadata", None)
                in_tokens = getattr(usage, "prompt_token_count", 0) if usage else 0
                out_tokens = getattr(usage, "candidates_token_count", 0) if usage else 0
                cost = cls.calculate_cost(in_tokens, out_tokens)

                telemetry = ExecutionTelemetry(
                    model_used=cls.PRIMARY_MODEL,
                    is_fallback=False,
                    duration_seconds=duration,
                    input_tokens=in_tokens,
                    output_tokens=out_tokens,
                    estimated_cost_usd=cost
                )
                return GatewayResponse(content=response.text, telemetry=telemetry)

            except Exception as e:
                print(f"[Gateway Warning] Primary model attempt {attempt+1} failed: {e}")
                time.sleep(0.5)

        # 2. Tripping to Fallback Model
        print(f"[Gateway Circuit Breaker] Tripping to FALLBACK model: '{cls.FALLBACK_MODEL}'...")
        try:
            fallback_response = client.models.generate_content(
                model=cls.FALLBACK_MODEL,
                contents=prompt,
                config=config,
            )
            duration = round(time.time() - start_time, 3)
            
            usage = getattr(fallback_response, "usage_metadata", None)
            in_tokens = getattr(usage, "prompt_token_count", 0) if usage else 0
            out_tokens = getattr(usage, "candidates_token_count", 0) if usage else 0
            cost = cls.calculate_cost(in_tokens, out_tokens)

            telemetry = ExecutionTelemetry(
                model_used=cls.FALLBACK_MODEL,
                is_fallback=True,
                duration_seconds=duration,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                estimated_cost_usd=cost
            )
            return GatewayResponse(content=fallback_response.text, telemetry=telemetry)
        except Exception as e:
            raise RuntimeError(f"All AI Gateway models failed: {e}")

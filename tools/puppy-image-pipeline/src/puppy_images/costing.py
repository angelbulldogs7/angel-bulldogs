from __future__ import annotations

from .models import CostEstimate


def estimate_per_attempt_usd(*, input_text_tokens: int, input_image_tokens: int, output_image_tokens: int, rates: dict[str, float]) -> float:
    text = (input_text_tokens / 1_000_000) * rates["input_text_per_million"]
    image_in = (input_image_tokens / 1_000_000) * rates["input_image_per_million"]
    image_out = (output_image_tokens / 1_000_000) * rates["output_image_per_million"]
    return text + image_in + image_out


def estimate_budget(
    *,
    attempts: int,
    per_attempt_usd: float,
    reserve_fraction: float,
    capped_budget_usd: float | None,
) -> CostEstimate:
    subtotal = attempts * per_attempt_usd
    reserve = subtotal * reserve_fraction
    return CostEstimate(
        attempts=attempts,
        per_attempt_usd=per_attempt_usd,
        subtotal_usd=subtotal,
        reserve_usd=reserve,
        capped_budget_usd=capped_budget_usd,
    )


def format_usd(value: float | None) -> str:
    if value is None:
        return "unset"
    return f"${value:,.2f}"

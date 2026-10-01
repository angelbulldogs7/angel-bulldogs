from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ResolvedVisibleTraits(BaseModel):
    model_config = ConfigDict(extra="forbid")

    base: Literal["standard", "fluffy", "hairless"]
    coat: str = Field(min_length=1)
    pigment_family: str = Field(min_length=1)
    phaeomelanin_regions: list[str]
    visible_pattern_placement: list[str]
    representative_eyes: Literal["dark-brown", "light-blue", "blue"]
    explicit_suppressed_traits: list[str]


class PhenotypeRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    visual_id: str = Field(pattern=r"^clv2-[0-9a-f]{8}$")
    visible_signature: str = Field(min_length=1)
    public_name: str = Field(min_length=1)
    aliases: list[str]
    coat_type: Literal["short", "fluffy", "hairless"]
    pigment_family: str = Field(min_length=1)
    resolved_visible_traits: ResolvedVisibleTraits
    representative_eyes: Literal["dark-brown", "light-blue", "blue"]
    big_rope: bool
    source_reference_ids: list[str]
    output_relative_path: str = Field(min_length=1)
    alt_text: str = Field(min_length=1)
    ruleset_version: str = Field(min_length=1)
    schema_version: int = Field(ge=1)
    notice_flags: list[str]

    @field_validator("output_relative_path")
    @classmethod
    def validate_output_relative_path(cls, value: str) -> str:
        normalized = value.replace("\\", "/")
        if normalized.startswith("/") or "/../" in f"/{normalized}/" or normalized.startswith("../"):
            raise ValueError("output_relative_path must stay inside pipeline outputs.")
        if not normalized.startswith("outputs/approved/"):
            raise ValueError("output_relative_path must start with outputs/approved/.")
        if not normalized.endswith(".webp"):
            raise ValueError("output_relative_path must end with .webp.")
        return normalized


class ReferenceEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    kind: str = Field(min_length=1)
    path: str = Field(min_length=1)
    approved: bool
    approval_evidence: str = Field(min_length=1)
    notes: str = Field(min_length=1)


class ReferenceRegistry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1)
    generated_by: str = Field(min_length=1)
    references: list[ReferenceEntry]


@dataclass(frozen=True)
class CostEstimate:
    attempts: int
    per_attempt_usd: float
    subtotal_usd: float
    reserve_usd: float
    capped_budget_usd: float | None

    @property
    def projected_total_usd(self) -> float:
        return self.subtotal_usd + self.reserve_usd


def as_jsonable(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump()
    if isinstance(value, list):
        return [as_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: as_jsonable(item) for key, item in value.items()}
    return value

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Iterable

from .models import PhenotypeRow


@dataclass(frozen=True)
class ManifestValidationResult:
    issues: list[str]

    @property
    def ok(self) -> bool:
        return not self.issues


def validate_manifest_rows(rows: Iterable[PhenotypeRow]) -> ManifestValidationResult:
    issues: list[str] = []
    ids: set[str] = set()
    signatures: set[str] = set()
    paths: set[str] = set()

    for row in rows:
        if row.visual_id in ids:
            issues.append(f"Duplicate visual_id: {row.visual_id}")
        ids.add(row.visual_id)

        if row.visible_signature in signatures:
            issues.append(f"Duplicate visible_signature: {row.visible_signature}")
        signatures.add(row.visible_signature)

        if row.output_relative_path in paths:
            issues.append(f"Duplicate output_relative_path: {row.output_relative_path}")
        paths.add(row.output_relative_path)

        if row.representative_eyes != row.resolved_visible_traits.representative_eyes:
            issues.append(f"Eyes mismatch for {row.visual_id}")

        if row.big_rope and "big-rope-visual" not in row.notice_flags:
            issues.append(f"Missing big-rope notice for {row.visual_id}")

    return ManifestValidationResult(issues=issues)


def summarize_rows(rows: Iterable[PhenotypeRow]) -> dict[str, dict[str, int] | int]:
    by_coat = Counter(row.coat_type for row in rows)
    by_pigment = Counter(row.pigment_family for row in rows)
    by_big_rope = Counter("on" if row.big_rope else "off" for row in rows)
    with_aliases = [row for row in rows if row.aliases]
    alias_count = sum(len(row.aliases) for row in with_aliases)
    return {
        "total_visual_signatures": sum(by_coat.values()),
        "counts_by_coat_type": dict(by_coat),
        "counts_by_pigment_family": dict(by_pigment),
        "counts_by_big_rope": dict(by_big_rope),
        "signatures_with_aliases": len(with_aliases),
        "alias_labels": alias_count,
    }

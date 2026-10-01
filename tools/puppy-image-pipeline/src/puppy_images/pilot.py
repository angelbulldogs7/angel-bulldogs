from __future__ import annotations

from dataclasses import dataclass

from .models import PhenotypeRow


@dataclass(frozen=True)
class PilotSelection:
    rows: list[PhenotypeRow]
    uncovered: list[str]


def _pick_first(
    pool: list[PhenotypeRow],
    picked: dict[str, PhenotypeRow],
    predicate,
) -> None:
    for row in picked.values():
        if predicate(row):
            return
    for row in pool:
        if row.visual_id in picked:
            continue
        if predicate(row):
            picked[row.visual_id] = row
            return


def _feature_set(row: PhenotypeRow) -> set[str]:
    features: set[str] = {
        f"coat_type:{row.coat_type}",
        f"coat:{row.resolved_visible_traits.coat}",
        f"pigment:{row.pigment_family}",
        f"big_rope:{'on' if row.big_rope else 'off'}",
    }
    for overlay in row.resolved_visible_traits.visible_pattern_placement:
        features.add(f"overlay:{overlay}")
    return features


def select_pilot(rows: list[PhenotypeRow], count: int = 10) -> PilotSelection:
    pool = sorted(rows, key=lambda item: (item.visual_id, item.output_relative_path))
    picked: dict[str, PhenotypeRow] = {}

    # Required coverage anchors from the spec.
    for coat_type in ("short", "fluffy", "hairless"):
        _pick_first(pool, picked, lambda row, coat_type=coat_type: row.coat_type == coat_type and not row.big_rope)

    _pick_first(
        pool,
        picked,
        lambda row: row.resolved_visible_traits.coat == "solid"
        and row.coat_type == "short"
        and not row.big_rope
        and not row.resolved_visible_traits.visible_pattern_placement,
    )

    _pick_first(pool, picked, lambda row: "merle-on-eumelanin-zones" in row.resolved_visible_traits.visible_pattern_placement)
    _pick_first(pool, picked, lambda row: "representative-pied-map" in row.resolved_visible_traits.visible_pattern_placement)
    _pick_first(pool, picked, lambda row: "brindle-stripes-over-phaeomelanin" in row.resolved_visible_traits.visible_pattern_placement)
    _pick_first(pool, picked, lambda row: row.resolved_visible_traits.coat == "and-tan")
    _pick_first(pool, picked, lambda row: row.resolved_visible_traits.coat == "cream-white" and "facial-mask" in row.resolved_visible_traits.visible_pattern_placement)
    _pick_first(pool, picked, lambda row: row.big_rope)
    _pick_first(pool, picked, lambda row: row.pigment_family == "none")
    _pick_first(
        pool,
        picked,
        lambda row: "merle-on-eumelanin-and-brindle-stripes" in row.resolved_visible_traits.visible_pattern_placement
        or (
            "representative-pied-map" in row.resolved_visible_traits.visible_pattern_placement
            and "merle-on-eumelanin-zones" in row.resolved_visible_traits.visible_pattern_placement
        ),
    )

    targets = {
        "coat_type:short",
        "coat_type:fluffy",
        "coat_type:hairless",
        "coat:solid",
        "coat:and-tan",
        "coat:cream-white",
        "overlay:brindle-stripes-over-phaeomelanin",
        "overlay:representative-pied-map",
        "overlay:merle-on-eumelanin-zones",
        "overlay:facial-mask",
        "big_rope:on",
        "pigment:black",
        "pigment:blue",
        "pigment:none",
    }

    while len(picked) < count:
        current_features = set().union(*(_feature_set(row) for row in picked.values())) if picked else set()
        uncovered_now = targets - current_features
        best_row: PhenotypeRow | None = None
        best_gain = -1
        for row in pool:
            if row.visual_id in picked:
                continue
            gain = len(_feature_set(row) & uncovered_now)
            if gain > best_gain:
                best_gain = gain
                best_row = row
        if best_row is None:
            break
        picked[best_row.visual_id] = best_row

    selected_rows = list(picked.values())[:count]
    selected_features = set().union(*(_feature_set(row) for row in selected_rows)) if selected_rows else set()
    uncovered = sorted(targets - selected_features)
    return PilotSelection(rows=selected_rows, uncovered=uncovered)

from __future__ import annotations

from puppy_images.models import PhenotypeRow
from puppy_images.pilot import select_pilot


def _row(
    visual_id: str,
    *,
    coat_type: str,
    coat: str,
    pigment: str,
    overlays: list[str],
    big_rope: bool = False,
) -> PhenotypeRow:
    return PhenotypeRow.model_validate(
        {
            "visual_id": visual_id,
            "visible_signature": f"sig-{visual_id}",
            "public_name": visual_id,
            "aliases": [],
            "coat_type": coat_type,
            "pigment_family": pigment,
            "resolved_visible_traits": {
                "base": "standard" if coat_type == "short" else coat_type,
                "coat": coat,
                "pigment_family": pigment,
                "phaeomelanin_regions": [],
                "visible_pattern_placement": overlays,
                "representative_eyes": "dark-brown",
                "explicit_suppressed_traits": ["carrier-state-hidden"],
            },
            "representative_eyes": "dark-brown",
            "big_rope": big_rope,
            "source_reference_ids": ["master/classic-fawn-solid-master-v2"],
            "output_relative_path": f"outputs/approved/{coat_type}/{pigment}/{visual_id}.webp",
            "alt_text": "Representative sample",
            "ruleset_version": "2.0.0",
            "schema_version": 2,
            "notice_flags": ["big-rope-visual"] if big_rope else [],
        }
    )


def test_select_pilot_covers_all_coat_types() -> None:
    rows = [
        _row("clv2-00000001", coat_type="short", coat="solid", pigment="black", overlays=[]),
        _row("clv2-00000002", coat_type="fluffy", coat="solid", pigment="blue", overlays=[]),
        _row("clv2-00000003", coat_type="hairless", coat="solid", pigment="none", overlays=[]),
        _row("clv2-00000004", coat_type="short", coat="and-tan", pigment="black", overlays=[]),
        _row("clv2-00000005", coat_type="short", coat="cream-white", pigment="none", overlays=["facial-mask"]),
        _row("clv2-00000006", coat_type="short", coat="fawn", pigment="black", overlays=["brindle-stripes-over-phaeomelanin"]),
        _row("clv2-00000007", coat_type="short", coat="solid", pigment="black", overlays=["merle-on-eumelanin-zones"]),
        _row("clv2-00000008", coat_type="short", coat="solid", pigment="black", overlays=["representative-pied-map"]),
        _row("clv2-00000009", coat_type="short", coat="fawn", pigment="black", overlays=["merle-on-eumelanin-and-brindle-stripes"]),
        _row("clv2-00000010", coat_type="fluffy", coat="solid", pigment="blue", overlays=[], big_rope=True),
    ]
    selection = select_pilot(rows, count=10)
    coats = {row.coat_type for row in selection.rows}
    assert coats == {"short", "fluffy", "hairless"}

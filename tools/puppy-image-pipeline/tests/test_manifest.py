from __future__ import annotations

from puppy_images.manifest import validate_manifest_rows
from puppy_images.models import PhenotypeRow


def _row(visual_id: str, signature: str, output_path: str, *, big_rope: bool = False) -> PhenotypeRow:
    return PhenotypeRow.model_validate(
        {
            "visual_id": visual_id,
            "visible_signature": signature,
            "public_name": "Sample Name",
            "aliases": [],
            "coat_type": "short",
            "pigment_family": "black",
            "resolved_visible_traits": {
                "base": "standard",
                "coat": "solid",
                "pigment_family": "black",
                "phaeomelanin_regions": [],
                "visible_pattern_placement": [],
                "representative_eyes": "dark-brown",
                "explicit_suppressed_traits": ["carrier-state-hidden"],
            },
            "representative_eyes": "dark-brown",
            "big_rope": big_rope,
            "source_reference_ids": ["master/classic-fawn-solid-master-v2"],
            "output_relative_path": output_path,
            "alt_text": "Representative sample",
            "ruleset_version": "2.0.0",
            "schema_version": 2,
            "notice_flags": ["big-rope-visual"] if big_rope else [],
        }
    )


def test_validate_manifest_detects_duplicate_outputs() -> None:
    rows = [
        _row("clv2-aaaaaaaa", "base=standard;coat=solid;pigment=black;mask=0;brindle=0;merle=0;pied=0;eyes=dark-brown;bigRope=0", "outputs/approved/short/black/one.webp"),
        _row("clv2-bbbbbbbb", "base=fluffy;coat=solid;pigment=black;mask=0;brindle=0;merle=0;pied=0;eyes=dark-brown;bigRope=0", "outputs/approved/short/black/one.webp"),
    ]
    result = validate_manifest_rows(rows)
    assert not result.ok
    assert any("Duplicate output_relative_path" in issue for issue in result.issues)


def test_validate_manifest_big_rope_notice() -> None:
    rows = [
        _row(
            "clv2-cccccccc",
            "base=hairless;coat=and-tan;pigment=blue;mask=0;brindle=0;merle=0;pied=0;eyes=dark-brown;bigRope=1",
            "outputs/approved/hairless/blue/two.webp",
            big_rope=True,
        )
    ]
    assert validate_manifest_rows(rows).ok

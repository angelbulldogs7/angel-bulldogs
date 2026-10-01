from __future__ import annotations

from pathlib import Path

from puppy_images.models import PhenotypeRow
from puppy_images.state import connect, init_db, status_counts, sync_jobs


def _row(visual_id: str) -> PhenotypeRow:
    return PhenotypeRow.model_validate(
        {
            "visual_id": visual_id,
            "visible_signature": f"base=standard;coat=solid;pigment=black;mask=0;brindle=0;merle=0;pied=0;eyes=dark-brown;bigRope=0;id={visual_id}",
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
            "big_rope": False,
            "source_reference_ids": ["master/classic-fawn-solid-master-v2"],
            "output_relative_path": f"outputs/approved/short/black/{visual_id}.webp",
            "alt_text": "Representative sample",
            "ruleset_version": "2.0.0",
            "schema_version": 2,
            "notice_flags": [],
        }
    )


def test_sync_jobs_idempotent(tmp_path: Path) -> None:
    db_path = tmp_path / "jobs.sqlite"
    conn = connect(db_path)
    init_db(conn)
    rows = [_row("clv2-11111111"), _row("clv2-22222222")]
    created, updated = sync_jobs(conn, rows, model="gpt-image-2.5-flare", prompt_hash="abc", budget_profile="phase1")
    assert created == 2
    assert updated == 0

    created_again, updated_again = sync_jobs(
        conn,
        rows,
        model="gpt-image-2.5-flare",
        prompt_hash="abc",
        budget_profile="phase1",
    )
    assert created_again == 0
    assert updated_again == 2
    assert status_counts(conn) == {"pending": 2}

    created_pruned, updated_pruned = sync_jobs(
        conn,
        [rows[0]],
        model="gpt-image-2.5-flare",
        prompt_hash="abc",
        budget_profile="phase1",
        prune_missing=True,
    )
    assert created_pruned == 0
    assert updated_pruned == 1
    assert status_counts(conn) == {"pending": 1}

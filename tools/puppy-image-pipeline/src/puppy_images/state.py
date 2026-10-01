from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Iterable

from .io import now_iso
from .models import PhenotypeRow

JOB_STATUSES = {
    "pending",
    "in_progress",
    "request_unknown",
    "generated",
    "technical_failed",
    "needs_review",
    "rejected",
    "approved",
    "exported",
}


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            visual_id TEXT PRIMARY KEY,
            visible_signature TEXT NOT NULL,
            output_relative_path TEXT NOT NULL,
            status TEXT NOT NULL,
            fingerprint TEXT NOT NULL,
            prompt_hash TEXT NOT NULL,
            model TEXT NOT NULL,
            budget_profile TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            approved_attempt_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS attempts (
            attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
            visual_id TEXT NOT NULL,
            attempt_no INTEGER NOT NULL,
            status TEXT NOT NULL,
            request_id TEXT,
            model TEXT,
            prompt_hash TEXT,
            output_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            cost_estimate_usd REAL,
            error_kind TEXT,
            error_message TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            UNIQUE(visual_id, attempt_no),
            FOREIGN KEY (visual_id) REFERENCES jobs(visual_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visual_id TEXT NOT NULL,
            decision TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (visual_id) REFERENCES jobs(visual_id) ON DELETE CASCADE
        );
        """
    )
    conn.commit()


def generation_fingerprint(row: PhenotypeRow, model: str, prompt_hash: str) -> str:
    digest = hashlib.sha256()
    digest.update(row.visible_signature.encode("utf-8"))
    digest.update(b"\0")
    digest.update(model.encode("utf-8"))
    digest.update(b"\0")
    digest.update(prompt_hash.encode("utf-8"))
    digest.update(b"\0")
    digest.update(json.dumps(row.source_reference_ids, separators=(",", ":"), ensure_ascii=True).encode("utf-8"))
    digest.update(b"\0")
    digest.update(row.ruleset_version.encode("utf-8"))
    return digest.hexdigest()


def sync_jobs(
    conn: sqlite3.Connection,
    rows: Iterable[PhenotypeRow],
    *,
    model: str,
    prompt_hash: str,
    budget_profile: str,
    prune_missing: bool = False,
) -> tuple[int, int]:
    materialized = list(rows)
    created = 0
    updated = 0
    for row in materialized:
        fingerprint = generation_fingerprint(row, model=model, prompt_hash=prompt_hash)
        existing = conn.execute("SELECT status FROM jobs WHERE visual_id = ?", (row.visual_id,)).fetchone()
        timestamp = now_iso()
        if existing is None:
            conn.execute(
                """
                INSERT INTO jobs (
                    visual_id, visible_signature, output_relative_path, status, fingerprint,
                    prompt_hash, model, budget_profile, created_at, updated_at
                )
                VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
                """,
                (
                    row.visual_id,
                    row.visible_signature,
                    row.output_relative_path,
                    fingerprint,
                    prompt_hash,
                    model,
                    budget_profile,
                    timestamp,
                    timestamp,
                ),
            )
            created += 1
            continue

        conn.execute(
            """
            UPDATE jobs
            SET visible_signature = ?, output_relative_path = ?, fingerprint = ?,
                prompt_hash = ?, model = ?, budget_profile = ?, updated_at = ?
            WHERE visual_id = ?
            """,
            (
                row.visible_signature,
                row.output_relative_path,
                fingerprint,
                prompt_hash,
                model,
                budget_profile,
                timestamp,
                row.visual_id,
            ),
        )
        updated += 1

    if prune_missing:
        keep_ids = [row.visual_id for row in materialized]
        if keep_ids:
            placeholders = ",".join("?" for _ in keep_ids)
            conn.execute(
                f"DELETE FROM jobs WHERE visual_id NOT IN ({placeholders})",
                keep_ids,
            )
        else:
            conn.execute("DELETE FROM jobs")
    conn.commit()
    return created, updated


def status_counts(conn: sqlite3.Connection) -> dict[str, int]:
    rows = conn.execute("SELECT status, COUNT(*) AS c FROM jobs GROUP BY status").fetchall()
    return {str(row["status"]): int(row["c"]) for row in rows}


def list_jobs(conn: sqlite3.Connection, status: str) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT visual_id, output_relative_path, status FROM jobs WHERE status = ? ORDER BY visual_id",
        (status,),
    ).fetchall()


def set_job_status(conn: sqlite3.Connection, visual_id: str, status: str) -> None:
    if status not in JOB_STATUSES:
        raise ValueError(f"Unknown status: {status}")
    conn.execute(
        "UPDATE jobs SET status = ?, updated_at = ? WHERE visual_id = ?",
        (status, now_iso(), visual_id),
    )
    conn.commit()


def add_attempt(
    conn: sqlite3.Connection,
    *,
    visual_id: str,
    status: str,
    model: str,
    prompt_hash: str,
    output_path: str | None,
    cost_estimate_usd: float,
    metadata: dict[str, object] | None = None,
) -> int:
    if status not in JOB_STATUSES:
        raise ValueError(f"Unknown attempt status: {status}")
    row = conn.execute(
        "SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next_no FROM attempts WHERE visual_id = ?",
        (visual_id,),
    ).fetchone()
    next_no = int(row["next_no"])
    timestamp = now_iso()
    conn.execute(
        """
        INSERT INTO attempts (
            visual_id, attempt_no, status, model, prompt_hash, output_path,
            created_at, updated_at, cost_estimate_usd, metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            visual_id,
            next_no,
            status,
            model,
            prompt_hash,
            output_path,
            timestamp,
            timestamp,
            cost_estimate_usd,
            json.dumps(metadata or {}, ensure_ascii=True),
        ),
    )
    conn.execute(
        "UPDATE jobs SET status = ?, updated_at = ? WHERE visual_id = ?",
        (status, timestamp, visual_id),
    )
    conn.commit()
    return int(conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"])


def add_decision(conn: sqlite3.Connection, visual_id: str, decision: str, notes: str) -> None:
    conn.execute(
        "INSERT INTO decisions (visual_id, decision, notes, created_at) VALUES (?, ?, ?, ?)",
        (visual_id, decision, notes, now_iso()),
    )
    conn.commit()


def latest_correction_notes(conn: sqlite3.Connection, visual_id: str) -> str | None:
    """Latest reject/correct notes for a visual ID, used on retry prompts."""
    row = conn.execute(
        """
        SELECT notes
        FROM decisions
        WHERE visual_id = ?
          AND decision IN ('rejected', 'correct', 'correction')
          AND TRIM(notes) != ''
        ORDER BY id DESC
        LIMIT 1
        """,
        (visual_id,),
    ).fetchone()
    if row is None:
        return None
    notes = str(row["notes"]).strip()
    return notes or None

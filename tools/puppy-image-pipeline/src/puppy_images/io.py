from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable

from dotenv import load_dotenv

from .models import PhenotypeRow

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = PIPELINE_ROOT.parent.parent

MANIFEST_PATH = PIPELINE_ROOT / "manifests" / "phenotypes.jsonl"
PILOT_PATH = PIPELINE_ROOT / "manifests" / "pilot.jsonl"
SUMMARY_PATH = PIPELINE_ROOT / "manifests" / "phenotype-summary.json"
STATE_DB_PATH = PIPELINE_ROOT / "state" / "jobs.sqlite"


def now_iso() -> str:
    return datetime.now(tz=UTC).replace(microsecond=0).isoformat()


def ensure_directories() -> None:
    for path in [
        PIPELINE_ROOT / "state",
        PIPELINE_ROOT / "outputs" / "raw",
        PIPELINE_ROOT / "outputs" / "drafts",
        PIPELINE_ROOT / "outputs" / "approved",
        PIPELINE_ROOT / "outputs" / "review",
        PIPELINE_ROOT / "outputs" / "logs",
        PIPELINE_ROOT / "docs",
        PIPELINE_ROOT / "manifests",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(read_text(path))


def save_json(path: Path, data: dict[str, Any]) -> None:
    write_text(path, json.dumps(data, indent=2, sort_keys=False) + "\n")


def load_manifest(path: Path = MANIFEST_PATH) -> list[PhenotypeRow]:
    rows: list[PhenotypeRow] = []
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    for line in read_text(path).splitlines():
        if not line.strip():
            continue
        rows.append(PhenotypeRow.model_validate_json(line))
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    lines = [json.dumps(row, ensure_ascii=True) for row in rows]
    write_text(path, ("\n".join(lines) + "\n") if lines else "")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_env() -> None:
    load_dotenv(PIPELINE_ROOT / ".env")


def prompt_hash(prompt_paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in prompt_paths:
        digest.update(path.as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(read_text(path).encode("utf-8"))
        digest.update(b"\0")
    return digest.hexdigest()

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from .io import REPO_ROOT, sha256_file
from .models import ReferenceEntry, ReferenceRegistry


@dataclass(frozen=True)
class ReferenceInspection:
    entry: ReferenceEntry
    exists: bool
    width: int | None
    height: int | None
    mode: str | None
    sha256: str | None
    error: str | None


def inspect_reference(entry: ReferenceEntry) -> ReferenceInspection:
    path = REPO_ROOT / entry.path
    if not path.exists():
        return ReferenceInspection(entry, False, None, None, None, None, None)

    width = None
    height = None
    mode = None
    digest = sha256_file(path)
    error = None
    try:
        with Image.open(path) as image:
            width, height = image.size
            mode = image.mode
    except (UnidentifiedImageError, OSError) as exc:
        error = str(exc)
    return ReferenceInspection(entry, True, width, height, mode, digest, error)


def inspect_registry(registry: ReferenceRegistry) -> list[ReferenceInspection]:
    return [inspect_reference(entry) for entry in registry.references]


def inventory_markdown(inspections: list[ReferenceInspection]) -> str:
    found = sum(1 for item in inspections if item.exists)
    missing = len(inspections) - found
    approved_total = sum(1 for item in inspections if item.entry.approved)
    approved_found = sum(1 for item in inspections if item.entry.approved and item.exists)
    lines = [
        "# Reference inventory",
        "",
        f"- Total references listed: {len(inspections)}",
        f"- Found locally: {found}",
        f"- Missing locally: {missing}",
        f"- Approved references: {approved_total} ({approved_found} present)",
        "",
        "| ID | Kind | Approved | Exists | Dimensions | Mode | SHA256 | Path | Evidence |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for item in inspections:
        dims = "—" if item.width is None else f"{item.width}x{item.height}"
        mode = item.mode or "—"
        digest = item.sha256 or "—"
        exists = "yes" if item.exists else "no"
        lines.append(
            "| {id} | {kind} | {approved} | {exists} | {dims} | {mode} | `{digest}` | `{path}` | {evidence} |".format(
                id=item.entry.id,
                kind=item.entry.kind,
                approved="yes" if item.entry.approved else "no",
                exists=exists,
                dims=dims,
                mode=mode,
                digest=digest,
                path=item.entry.path,
                evidence=item.entry.approval_evidence,
            )
        )
        if item.error:
            lines.append(f"|  |  |  |  |  |  |  |  | decode error: {item.error} |")
    lines.append("")
    lines.append("Notes:")
    if missing > 0:
        lines.append("- Some reference files are still missing from disk.")
    else:
        lines.append("- All listed reference files are present on disk.")
    if approved_total == 0:
        lines.append("- None are marked approved yet, so paid pilot generation remains blocked.")
    elif approved_found < approved_total:
        lines.append("- Some approved references are missing locally; do not run paid pilot yet.")
    else:
        lines.append("- Approved references are present. Paid pilot is still gated by explicit execute flag and credentials.")
    return "\n".join(lines) + "\n"

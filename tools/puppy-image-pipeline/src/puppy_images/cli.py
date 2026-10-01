from __future__ import annotations

import argparse
import math
import os
import sqlite3
import sys
from pathlib import Path

from PIL import Image

from .costing import estimate_budget, estimate_per_attempt_usd, format_usd
from .generate import (
    PaidExecutionDisabledError,
    compose_prompt,
    record_live_generation,
    record_mock_generation,
    require_paid_execution,
)
from .inventory import inspect_registry, inventory_markdown
from .io import (
    MANIFEST_PATH,
    PILOT_PATH,
    PIPELINE_ROOT,
    REPO_ROOT,
    STATE_DB_PATH,
    SUMMARY_PATH,
    ensure_directories,
    load_env,
    load_json,
    load_manifest,
    now_iso,
    prompt_hash,
    read_text,
    save_json,
    write_jsonl,
    write_text,
)
from .manifest import summarize_rows, validate_manifest_rows
from .models import PhenotypeRow, ReferenceRegistry
from .pilot import select_pilot
from .state import (
    add_attempt,
    add_decision,
    connect,
    init_db,
    latest_correction_notes,
    list_jobs,
    set_job_status,
    status_counts,
    sync_jobs,
)


def _load_pipeline_config(path: Path) -> dict:
    return load_json(path)


def _load_pricing(path: Path) -> dict:
    return load_json(path)


def _load_registry(path: Path) -> ReferenceRegistry:
    return ReferenceRegistry.model_validate(load_json(path))


def _load_pilot_rows(path: Path) -> list[PhenotypeRow]:
    rows: list[PhenotypeRow] = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        rows.append(PhenotypeRow.model_validate_json(line))
    return rows


def cmd_inventory(args: argparse.Namespace) -> int:
    ensure_directories()
    registry = _load_registry(Path(args.registry))
    inspections = inspect_registry(registry)
    markdown = inventory_markdown(inspections)
    out = Path(args.output)
    write_text(out, markdown)
    found = sum(1 for item in inspections if item.exists)
    print(f"[inventory] wrote {out.relative_to(PIPELINE_ROOT)} ({found}/{len(inspections)} references found)")
    return 0


def cmd_manifest_validate(args: argparse.Namespace) -> int:
    rows = load_manifest(Path(args.manifest))
    result = validate_manifest_rows(rows)
    summary = summarize_rows(rows)
    print(f"[manifest] rows={summary['total_visual_signatures']}")
    if result.issues:
        print("[manifest] validation failed:")
        for issue in result.issues:
            print(f"  - {issue}")
        return 1
    print("[manifest] validation passed")
    return 0


def cmd_pilot_select(args: argparse.Namespace) -> int:
    rows = load_manifest(Path(args.manifest))
    selection = select_pilot(rows, count=args.count)
    out = Path(args.output)
    write_jsonl(out, [row.model_dump() for row in selection.rows])

    notes = [
        "# Pilot selection",
        "",
        f"- Generated at: {now_iso()}",
        f"- Requested count: {args.count}",
        f"- Selected: {len(selection.rows)}",
        "",
        "## Visual IDs",
        "",
    ]
    notes.extend([f"- `{row.visual_id}` — {row.public_name}" for row in selection.rows])
    notes.extend(["", "## Uncovered target classes", ""])
    if selection.uncovered:
        notes.extend([f"- {item}" for item in selection.uncovered])
    else:
        notes.append("- none")
    write_text(PIPELINE_ROOT / "docs" / "pilot-selection.md", "\n".join(notes) + "\n")
    print(f"[pilot] wrote {out.relative_to(PIPELINE_ROOT)} with {len(selection.rows)} rows")
    return 0


def _budget_profile(config: dict, name: str) -> dict:
    profiles = config.get("budget_profiles", {})
    if name not in profiles:
        raise KeyError(f"Unknown budget profile: {name}")
    return profiles[name]


def cmd_dry_run(args: argparse.Namespace) -> int:
    ensure_directories()
    manifest_rows = load_manifest(Path(args.manifest))
    rows = manifest_rows
    if args.pilot_only:
        pilot_rows = _load_pilot_rows(Path(args.pilot))
        pilot_ids = {row.visual_id for row in pilot_rows}
        rows = [row for row in manifest_rows if row.visual_id in pilot_ids]

    config = _load_pipeline_config(Path(args.config))
    model = args.model or config["default_model"]
    prompt_files = [PIPELINE_ROOT / relative for relative in config.get("prompt_files", [])]
    prompt_digest = prompt_hash(prompt_files)
    conn = connect(Path(args.state_db))
    init_db(conn)
    created, updated = sync_jobs(
        conn,
        rows,
        model=model,
        prompt_hash=prompt_digest,
        budget_profile=args.budget_profile,
        prune_missing=args.pilot_only,
    )
    counts = status_counts(conn)
    log = {
        "generated_at": now_iso(),
        "rows_considered": len(rows),
        "created": created,
        "updated": updated,
        "status_counts": counts,
        "model": model,
        "budget_profile": args.budget_profile,
    }
    save_json(PIPELINE_ROOT / "outputs" / "logs" / "dry-run.latest.json", log)
    print(f"[dry-run] jobs considered={len(rows)} created={created} updated={updated}")
    return 0


def cmd_credentials_check(args: argparse.Namespace) -> int:
    load_env()
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        print("[credentials] OPENAI_API_KEY not set in tools/puppy-image-pipeline/.env")
        return 0 if args.allow_missing else 2
    masked = f"{key[:5]}...{key[-4:]}" if len(key) > 10 else "***"
    print(f"[credentials] OPENAI_API_KEY detected ({masked})")
    return 0


def cmd_capabilities_check(args: argparse.Namespace) -> int:
    load_env()
    try:
        import openai  # pylint: disable=import-outside-toplevel

        sdk_version = getattr(openai, "__version__", "unknown")
    except Exception:  # pragma: no cover - defensive fallback
        sdk_version = "not-installed"

    config = _load_pipeline_config(Path(args.config))
    lines = [
        "# API capabilities check",
        "",
        f"- Checked at: {now_iso()}",
        f"- Mode: {'live' if args.live else 'offline'}",
        f"- OpenAI Python SDK: `{sdk_version}`",
        "- Candidate models:",
        f"  - `{config['default_model']}`",
        f"  - `{config['fallback_model']}`",
        "",
        "Sources:",
        "- https://developers.openai.com/api/docs/guides/image-generation",
        "- https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
        "- https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst",
        "",
    ]
    if args.live:
        lines.extend(
            [
                "Live probes are intentionally disabled in Phase 1 to avoid accidental paid requests.",
                "Run live checks only during pilot with explicit owner approval.",
            ]
        )
    else:
        lines.append("Offline verification completed; no network requests were executed.")
    write_text(PIPELINE_ROOT / "docs" / "api-capabilities.md", "\n".join(lines) + "\n")
    print("[capabilities] wrote docs/api-capabilities.md")
    return 0


def cmd_cost_estimate(args: argparse.Namespace) -> int:
    config = _load_pipeline_config(Path(args.config))
    pricing = _load_pricing(Path(args.pricing))
    pilot_rows = _load_pilot_rows(Path(args.pilot))
    if not pilot_rows:
        print("[cost] pilot manifest is empty; run pilot-select first")
        return 1

    model = args.model or config["default_model"]
    rates = pricing["models"][model]
    token_estimates = config["token_estimates"]
    per_attempt = estimate_per_attempt_usd(
        input_text_tokens=int(token_estimates["input_text_tokens"]),
        input_image_tokens=int(token_estimates["input_image_tokens"]),
        output_image_tokens=int(token_estimates["output_image_tokens"]),
        rates=rates,
    )
    retry_reserve_fraction = float(config.get("retry_reserve_fraction", 0.3))
    retry_attempts = math.ceil(len(pilot_rows) * retry_reserve_fraction)
    attempts = len(pilot_rows) + retry_attempts
    profile = _budget_profile(config, args.budget_profile)
    estimate = estimate_budget(
        attempts=attempts,
        per_attempt_usd=per_attempt,
        reserve_fraction=retry_reserve_fraction,
        capped_budget_usd=profile.get("usd_limit"),
    )

    lines = [
        "# Cost report",
        "",
        f"- Generated at: {now_iso()}",
        f"- Model: `{model}`",
        f"- Pilot rows: {len(pilot_rows)}",
        f"- Retry reserve attempts: {retry_attempts}",
        f"- Budget profile: `{args.budget_profile}`",
        f"- Budget cap: {format_usd(profile.get('usd_limit'))}",
        "",
        "## Token assumptions per attempt",
        "",
        f"- Input text tokens: {token_estimates['input_text_tokens']}",
        f"- Input image tokens: {token_estimates['input_image_tokens']}",
        f"- Output image tokens: {token_estimates['output_image_tokens']}",
        "",
        "## Estimate",
        "",
        f"- Per attempt estimate: {format_usd(estimate.per_attempt_usd)}",
        f"- Attempts included: {estimate.attempts}",
        f"- Subtotal: {format_usd(estimate.subtotal_usd)}",
        f"- Conservative reserve ({int(retry_reserve_fraction * 100)}%): {format_usd(estimate.reserve_usd)}",
        f"- Projected total: {format_usd(estimate.projected_total_usd)}",
        "",
        "Computed values are local estimates until reconciled with provider usage/billing.",
    ]
    write_text(Path(args.output), "\n".join(lines) + "\n")
    print(f"[cost] wrote {Path(args.output).relative_to(PIPELINE_ROOT)}")
    return 0


def _connect_initialized(path: Path) -> sqlite3.Connection:
    conn = connect(path)
    init_db(conn)
    return conn


def cmd_status(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    counts = status_counts(conn)
    if not counts:
        print("[status] no jobs in state database")
        return 0
    print("[status] job counts")
    for status, count in sorted(counts.items()):
        print(f"  {status}: {count}")
    return 0


def cmd_resume(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    pending = list_jobs(conn, "pending")
    unknown = list_jobs(conn, "request_unknown")
    print(f"[resume] pending={len(pending)} request_unknown={len(unknown)}")
    if unknown:
        print("[resume] reconcile unknown requests before issuing retries.")
    print("[resume] next (paid pilot): python -m puppy_images generate --execute-paid --budget-profile pilot --limit 10")
    return 0


def cmd_generate(args: argparse.Namespace) -> int:
    config = _load_pipeline_config(Path(args.config))
    profile = _budget_profile(config, args.budget_profile)
    try:
        require_paid_execution(args.execute_paid, bool(profile.get("paid_execution")))
    except PaidExecutionDisabledError as exc:
        print(f"[generate] blocked: {exc}")
        return 2

    conn = _connect_initialized(Path(args.state_db))
    rows = load_manifest(Path(args.manifest))
    by_id = {row.visual_id: row for row in rows}
    pending = list_jobs(conn, "pending")
    if not pending:
        print("[generate] no pending jobs")
        return 0

    selected = pending
    if args.pilot_only:
        pilot_ids = {row.visual_id for row in _load_pilot_rows(Path(args.pilot))}
        selected = [row for row in selected if str(row["visual_id"]) in pilot_ids]
    if args.limit:
        selected = selected[: args.limit]
    prompt_files = [PIPELINE_ROOT / relative for relative in config.get("prompt_files", [])]
    prompt_digest = prompt_hash(prompt_files)
    model = args.model or config["default_model"]
    size = config.get("image_size", "1024x1024")
    quality = args.quality or config.get("quality", "medium")
    master_prompt = read_text(PIPELINE_ROOT / "prompts" / "master.md")
    coat_rules = load_json(PIPELINE_ROOT / "prompts" / "coat-rules.json")
    registry = _load_registry(Path(args.registry))
    load_env()
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    api_project = os.environ.get("OPENAI_PROJECT", "").strip() or None

    if not args.mock_api and not api_key:
        print("[generate] OPENAI_API_KEY is required for live mode.")
        return 2

    for row in selected:
        visual_id = str(row["visual_id"])
        phenotype = by_id.get(visual_id)
        if phenotype is None:
            continue
        correction = latest_correction_notes(conn, visual_id)
        prompt_text = compose_prompt(
            master_prompt,
            phenotype,
            coat_rules=coat_rules,
            correction_notes=correction,
        )
        # Surgical edits require an explicit flag; corrections alone do a fresh generation.
        edit_from_latest = bool(args.edit_from_latest) and not bool(getattr(args, "fresh", False))
        if getattr(args, "fresh", False):
            edit_from_latest = False
        extra_refs: list[Path] = []
        # Do not attach extra outdoor anatomy photos during surgical edits; they degrade studio cutouts.
        try:
            if args.mock_api:
                out = record_mock_generation(
                    conn,
                    row=phenotype,
                    model=model,
                    prompt_hash=prompt_digest,
                    prompt_text=prompt_text,
                )
                print(f"[generate] mock generated {visual_id} -> {out.relative_to(PIPELINE_ROOT)}")
            else:
                out = record_live_generation(
                    conn,
                    row=phenotype,
                    model=model,
                    prompt_hash=prompt_digest,
                    prompt_text=prompt_text,
                    size=size,
                    quality=quality,
                    registry=registry,
                    api_key=api_key,
                    api_project=api_project,
                    edit_from_latest=edit_from_latest,
                    extra_reference_paths=extra_refs,
                )
                print(f"[generate] generated {visual_id} -> {out.relative_to(PIPELINE_ROOT)}")
        except Exception as exc:  # pragma: no cover - operational guard
            add_attempt(
                conn,
                visual_id=visual_id,
                status="technical_failed",
                model=model,
                prompt_hash=prompt_digest,
                output_path=None,
                cost_estimate_usd=0.0,
                metadata={"error": str(exc)},
            )
            print(f"[generate] failed {visual_id}: {exc}")
    return 0


def cmd_review(args: argparse.Namespace) -> int:
    from .review import build_review_gallery  # local import to keep startup light

    pilot_rows = _load_pilot_rows(Path(args.pilot))
    rows = pilot_rows or load_manifest(Path(args.manifest))
    build_review_gallery(rows, Path(args.output))
    print(f"[review] wrote {Path(args.output).relative_to(PIPELINE_ROOT)}")
    return 0


def cmd_approve(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    set_job_status(conn, args.visual_id, "approved")
    add_decision(conn, args.visual_id, "approved", args.notes or "")
    print(f"[review] approved {args.visual_id}")
    return 0


def cmd_reject(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    set_job_status(conn, args.visual_id, "rejected")
    add_decision(conn, args.visual_id, "rejected", args.notes or "")
    print(f"[review] rejected {args.visual_id}")
    return 0


def cmd_retry(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    for visual_id in args.visual_ids:
        set_job_status(conn, visual_id, "pending")
    print(f"[retry] moved {len(args.visual_ids)} job(s) back to pending")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    conn = _connect_initialized(Path(args.state_db))
    approved_jobs = conn.execute(
        "SELECT visual_id, output_relative_path FROM jobs WHERE status = 'approved' ORDER BY visual_id"
    ).fetchall()
    if not approved_jobs:
        print("[export] no approved jobs to export")
        return 0

    exported = 0
    for job in approved_jobs[: args.limit] if args.limit else approved_jobs:
        attempt = conn.execute(
            "SELECT output_path FROM attempts WHERE visual_id = ? ORDER BY attempt_no DESC LIMIT 1",
            (job["visual_id"],),
        ).fetchone()
        if not attempt or not attempt["output_path"]:
            continue
        source = PIPELINE_ROOT / str(attempt["output_path"])
        if not source.exists():
            continue
        output_webp = PIPELINE_ROOT / str(job["output_relative_path"])
        output_webp.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as image:
            rgba = image.convert("RGBA")
            rgba.save(output_webp, format="WEBP", lossless=True, quality=88, method=6)
            card = rgba.copy()
            card.thumbnail((420, 420))
            card_out = output_webp.with_name(output_webp.stem + "--card.webp")
            card.save(card_out, format="WEBP", lossless=False, quality=82, method=6)
        set_job_status(conn, str(job["visual_id"]), "exported")
        exported += 1

    print(f"[export] exported {exported} job(s)")
    return 0


def cmd_audit(args: argparse.Namespace) -> int:
    rows = load_manifest(Path(args.manifest))
    summary = summarize_rows(rows)
    exported_summary = load_json(Path(args.summary)) if Path(args.summary).exists() else {}
    conn = _connect_initialized(Path(args.state_db))
    statuses = status_counts(conn)

    historical_target = int(exported_summary.get("historical_target", 3454))
    total = int(summary["total_visual_signatures"])
    delta = total - historical_target
    exclusions = exported_summary.get("exclusions", {})
    aliases = exported_summary.get("deduplicated_aliases", {})
    counts_by_coat = summary["counts_by_coat_type"]
    counts_by_pigment = summary["counts_by_pigment_family"]
    counts_by_big_rope = summary["counts_by_big_rope"]

    lines = [
        "# Scope audit",
        "",
        f"- Generated at: {now_iso()}",
        f"- Manifest rows (supported visible signatures): {total}",
        f"- Historical reference target: {historical_target}",
        f"- Delta: {delta}",
        "",
        "The mismatch is expected: current ruleset deduplicates by visible signature and excludes non-puppy outcomes (safety panel and nonviable conception), while historical planning counts referenced an earlier broader target.",
        "",
        "## Counts by coat type",
        "",
    ]
    for key, value in sorted(counts_by_coat.items()):
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Counts by pigment family", ""])
    for key, value in sorted(counts_by_pigment.items()):
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Counts by Big Rope", ""])
    for key, value in sorted(counts_by_big_rope.items()):
        lines.append(f"- {key}: {value}")
    lines.extend(["", "## Excluded outcomes", ""])
    if exclusions:
        lines.append(f"- Concerning (double Merle safety panel): {exclusions.get('concerning', 'unknown')}")
        lines.append(f"- Nonviable within selectable profiles: {exclusions.get('nonviable_selectable', 'unknown')}")
        lines.append(
            "- Nonviable including conception-only FOXI3 Dup/Dup class: "
            f"{exclusions.get('nonviable_including_conception_only_foxi3', 'unknown')}"
        )
    else:
        lines.append("- Exclusion summary unavailable; rerun color-lab phenotype export.")
    lines.extend(["", "## Deduplicated aliases", ""])
    lines.append(f"- Signatures with aliases: {aliases.get('signatures_with_aliases', 0)}")
    lines.append(f"- Alias labels collapsed: {aliases.get('alias_labels', 0)}")
    lines.extend(["", "## Pipeline state status", ""])
    if statuses:
        for key, value in sorted(statuses.items()):
            lines.append(f"- {key}: {value}")
    else:
        lines.append("- No jobs queued yet.")
    lines.extend(
        [
            "",
            "## Missing references",
            "",
            "- Required approved anchors and master references are still missing in-repo.",
            "- Hairless anchor remains a blocker only for Hairless generation; other coats can proceed when their anchors are approved.",
        ]
    )
    write_text(Path(args.output), "\n".join(lines) + "\n")
    print(f"[audit] wrote {Path(args.output).relative_to(PIPELINE_ROOT)}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Angel Bulldogs puppy image pipeline")
    sub = parser.add_subparsers(dest="command", required=True)

    inventory = sub.add_parser("inventory", help="Inspect reference files and write inventory markdown")
    inventory.add_argument("--registry", default=str(PIPELINE_ROOT / "references" / "registry.json"))
    inventory.add_argument("--output", default=str(PIPELINE_ROOT / "docs" / "inventory.md"))
    inventory.set_defaults(func=cmd_inventory)

    validate = sub.add_parser("manifest-validate", help="Validate phenotype manifest JSONL")
    validate.add_argument("--manifest", default=str(MANIFEST_PATH))
    validate.set_defaults(func=cmd_manifest_validate)

    pilot = sub.add_parser("pilot-select", help="Select coverage-oriented pilot rows")
    pilot.add_argument("--manifest", default=str(MANIFEST_PATH))
    pilot.add_argument("--count", type=int, default=10)
    pilot.add_argument("--output", default=str(PILOT_PATH))
    pilot.set_defaults(func=cmd_pilot_select)

    dry_run = sub.add_parser("dry-run", help="Queue jobs offline without API calls")
    dry_run.add_argument("--manifest", default=str(MANIFEST_PATH))
    dry_run.add_argument("--pilot", default=str(PILOT_PATH))
    dry_run.add_argument("--pilot-only", action="store_true")
    dry_run.add_argument("--state-db", default=str(STATE_DB_PATH))
    dry_run.add_argument("--config", default=str(PIPELINE_ROOT / "config" / "pipeline.json"))
    dry_run.add_argument("--budget-profile", default="phase1")
    dry_run.add_argument("--model", default=None)
    dry_run.set_defaults(func=cmd_dry_run)

    creds = sub.add_parser("credentials-check", help="Check .env credentials")
    creds.add_argument("--allow-missing", action="store_true")
    creds.set_defaults(func=cmd_credentials_check)

    cap = sub.add_parser("capabilities-check", help="Record API capability notes")
    cap.add_argument("--config", default=str(PIPELINE_ROOT / "config" / "pipeline.json"))
    cap.add_argument("--live", action="store_true")
    cap.set_defaults(func=cmd_capabilities_check)

    cost = sub.add_parser("cost-estimate", help="Estimate pilot spend using local pricing")
    cost.add_argument("--config", default=str(PIPELINE_ROOT / "config" / "pipeline.json"))
    cost.add_argument("--pricing", default=str(PIPELINE_ROOT / "config" / "pricing.json"))
    cost.add_argument("--pilot", default=str(PILOT_PATH))
    cost.add_argument("--model", default=None)
    cost.add_argument("--budget-profile", default="pilot")
    cost.add_argument("--output", default=str(PIPELINE_ROOT / "docs" / "cost-report.md"))
    cost.set_defaults(func=cmd_cost_estimate)

    status = sub.add_parser("status", help="Show job status counts")
    status.add_argument("--state-db", default=str(STATE_DB_PATH))
    status.set_defaults(func=cmd_status)

    resume = sub.add_parser("resume", help="Show resumable next action")
    resume.add_argument("--state-db", default=str(STATE_DB_PATH))
    resume.set_defaults(func=cmd_resume)

    generate = sub.add_parser("generate", help="Run generation queue (guarded)")
    generate.add_argument("--manifest", default=str(MANIFEST_PATH))
    generate.add_argument("--config", default=str(PIPELINE_ROOT / "config" / "pipeline.json"))
    generate.add_argument("--state-db", default=str(STATE_DB_PATH))
    generate.add_argument("--pilot", default=str(PILOT_PATH))
    generate.add_argument("--pilot-only", action="store_true")
    generate.add_argument("--registry", default=str(PIPELINE_ROOT / "references" / "registry.json"))
    generate.add_argument("--budget-profile", default="pilot")
    generate.add_argument("--execute-paid", action="store_true")
    generate.add_argument("--mock-api", action="store_true")
    generate.add_argument("--model", default=None)
    generate.add_argument("--quality", default=None, help="Override pipeline quality, e.g. medium|high")
    generate.add_argument(
        "--edit-from-latest",
        action="store_true",
        help="Use latest raw output as primary edit source for surgical corrections",
    )
    generate.add_argument(
        "--fresh",
        action="store_true",
        help="Force a fresh generation from approved anchors (ignore latest draft)",
    )
    generate.add_argument("--limit", type=int, default=0)
    generate.set_defaults(func=cmd_generate)

    review = sub.add_parser("review", help="Build static review gallery")
    review.add_argument("--pilot", default=str(PILOT_PATH))
    review.add_argument("--manifest", default=str(MANIFEST_PATH))
    review.add_argument("--output", default=str(PIPELINE_ROOT / "outputs" / "review" / "gallery.html"))
    review.set_defaults(func=cmd_review)

    approve = sub.add_parser("approve", help="Approve one visual ID")
    approve.add_argument("visual_id")
    approve.add_argument("--notes", default="")
    approve.add_argument("--state-db", default=str(STATE_DB_PATH))
    approve.set_defaults(func=cmd_approve)

    reject = sub.add_parser("reject", help="Reject one visual ID")
    reject.add_argument("visual_id")
    reject.add_argument("--notes", default="")
    reject.add_argument("--state-db", default=str(STATE_DB_PATH))
    reject.set_defaults(func=cmd_reject)

    retry = sub.add_parser("retry", help="Move one or more jobs back to pending")
    retry.add_argument("visual_ids", nargs="+")
    retry.add_argument("--state-db", default=str(STATE_DB_PATH))
    retry.set_defaults(func=cmd_retry)

    export = sub.add_parser("export", help="Export approved drafts to web derivatives")
    export.add_argument("--state-db", default=str(STATE_DB_PATH))
    export.add_argument("--limit", type=int, default=0)
    export.set_defaults(func=cmd_export)

    audit = sub.add_parser("audit", help="Write scope and completeness audit report")
    audit.add_argument("--manifest", default=str(MANIFEST_PATH))
    audit.add_argument("--summary", default=str(SUMMARY_PATH))
    audit.add_argument("--state-db", default=str(STATE_DB_PATH))
    audit.add_argument("--output", default=str(PIPELINE_ROOT / "docs" / "scope-audit.md"))
    audit.set_defaults(func=cmd_audit)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except FileNotFoundError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1
    except KeyError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # pragma: no cover - top-level safety
        print(f"[error] unexpected failure: {exc}", file=sys.stderr)
        return 1

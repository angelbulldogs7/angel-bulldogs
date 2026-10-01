from __future__ import annotations

import base64
import json
from contextlib import ExitStack
from pathlib import Path

from PIL import Image, ImageDraw

from .io import PIPELINE_ROOT, REPO_ROOT, now_iso
from .models import PhenotypeRow, ReferenceRegistry
from .state import add_attempt


class PaidExecutionDisabledError(RuntimeError):
    pass


def require_paid_execution(execute_paid: bool, budget_allows_paid: bool) -> None:
    if not execute_paid:
        raise PaidExecutionDisabledError("Paid generation is disabled. Use --execute-paid to run paid requests.")
    if not budget_allows_paid:
        raise PaidExecutionDisabledError("Selected budget profile does not allow paid execution.")


def _hairless_skin_guidance(row: PhenotypeRow) -> dict:
    """Collapse coat-color traits into bare-skin guidance so the model does not paint a bald fur map."""
    overlays = set(row.resolved_visible_traits.visible_pattern_placement)
    coat = row.resolved_visible_traits.coat
    light_families = {
        "none",
        "cream",
        "cream-white",
        "platinum",
        "lilac",
        "isabella",
        "new-shade-isabella",
        "cocoa",
        "blue",
    }
    base_skin = (
        "light pink/cream flesh skin"
        if row.pigment_family in light_families or coat in {"cream-white", "platinum", "solid"}
        else "predominantly darker pigmented skin with some lighter flesh areas"
    )
    mark_notes: list[str] = []
    if any("mask" in item or item == "facial-mask" for item in overlays) or "mask=1" in row.visible_signature:
        mark_notes.append("optional soft darker skin pigment on muzzle/around eyes only")
    if any("merle" in item for item in overlays):
        mark_notes.append("at most a few faint irregular darker skin freckles — never a full merle coat map")
    if any("brindle" in item for item in overlays):
        mark_notes.append("no brindle stripes; at most barely-visible soft mottling in skin tone")
    if any("pied" in item for item in overlays):
        mark_notes.append("pied shows as large areas of plain light skin with sparse soft darker pigment patches, not white fur panels")
    if coat in {"and-tan", "sable", "husky"}:
        mark_notes.append("tan/sable points only as very soft darker skin shading at ears/muzzle if visible at all")
    if not mark_notes:
        mark_notes.append("mostly even skin tone; minimal freckling only")
    return {
        "base": "hairless",
        "render_as": "bare_skin_only",
        "base_skin_tone": base_skin,
        "coat_color_blocked": True,
        "source_coat_label_for_catalog_only": coat,
        "source_pigment_family_for_catalog_only": row.pigment_family,
        "allowed_skin_marks": mark_notes,
        "forbidden": [
            "fur texture",
            "peach fuzz",
            "coat sheen",
            "painted fur color blanket",
            "bold brindle/merle/pied coat maps on a bald body",
        ],
        "representative_eyes": row.representative_eyes,
        "explicit_suppressed_traits": row.resolved_visible_traits.explicit_suppressed_traits,
    }


def compose_prompt(
    master_prompt: str,
    row: PhenotypeRow,
    *,
    coat_rules: dict[str, str] | None = None,
    correction_notes: str | None = None,
) -> str:
    if row.coat_type == "hairless":
        payload = {
            "visual_id": row.visual_id,
            "public_name": row.public_name,
            "aliases": row.aliases,
            "coat_type": "hairless",
            "representative_eyes": row.representative_eyes,
            "big_rope": row.big_rope,
            "hairless_skin_guidance": _hairless_skin_guidance(row),
            "notice_flags": row.notice_flags,
            "note": "Do not render the catalog coat/pattern labels as fur. Hairless collapses almost all color to skin.",
        }
        traits_heading = "Hairless skin guidance (catalog coat color is blocked — render skin only):"
    else:
        payload = {
            "visual_id": row.visual_id,
            "public_name": row.public_name,
            "aliases": row.aliases,
            "coat_type": row.coat_type,
            "pigment_family": row.pigment_family,
            "representative_eyes": row.representative_eyes,
            "big_rope": row.big_rope,
            "resolved_visible_traits": row.resolved_visible_traits.model_dump(),
            "notice_flags": row.notice_flags,
        }
        traits_heading = "Resolved visible traits (deterministic manifest row):"
    sections = [
        master_prompt.strip(),
        traits_heading,
        json.dumps(payload, indent=2, ensure_ascii=True),
    ]
    if coat_rules:
        coat_key = row.coat_type if row.coat_type in coat_rules else "short"
        coat_text = coat_rules.get(coat_key, "")
        big_rope_key = "big_rope_on" if row.big_rope else "big_rope_off"
        big_rope_text = coat_rules.get(big_rope_key, "")
        sections.extend(
            [
                "Coat and conformation rules:",
                f"- Coat ({coat_key}): {coat_text}",
                f"- Big Rope: {big_rope_text}",
            ]
        )
    if row.coat_type == "hairless":
        sections.extend(
            [
                "Hairless rendering override (mandatory):",
                "- Sphynx-like bare skin French Bulldog: you must see skin, not a normal puppy that happens to be bald.",
                "- Almost all coat color is blocked. Body = light pink/cream skin and/or dark pigmented skin only.",
                "- Brindle, merle, pied, sable, tan, and solid coat colors are NOT painted as fur patterns — only faint soft skin pigment marks if anything.",
                "- No fur texture, peach fuzz, coat sheen, or hair edge fringe.",
                "- Preserve the exact same puppy identity, standing three-quarter pose, scale, camera, lighting, and transparent studio cutout as the other Color Lab puppies.",
            ]
        )
    if correction_notes and correction_notes.strip():
        sections.extend(
            [
                "Owner correction notes for this retry (mandatory):",
                correction_notes.strip(),
            ]
        )
    return "\n\n".join(sections) + "\n"


def persist_prompt(visual_id: str, prompt_text: str, prompt_hash: str) -> Path:
    prompt_dir = PIPELINE_ROOT / "outputs" / "logs" / "prompts"
    prompt_dir.mkdir(parents=True, exist_ok=True)
    path = prompt_dir / f"{visual_id}.prompt.txt"
    path.write_text(f"prompt_hash={prompt_hash}\n\n{prompt_text}", encoding="utf-8")
    return path


def write_mock_draft_image(row: PhenotypeRow) -> Path:
    # Offline placeholder used only for dry-run and tests; never used as production output.
    out = PIPELINE_ROOT / "outputs" / "drafts" / row.coat_type / row.pigment_family / row.visual_id / "mock-attempt.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((220, 180, 820, 820), outline=(30, 30, 30, 255), width=6)
    draw.text((40, 920), row.visual_id, fill=(20, 20, 20, 255))
    image.save(out, format="PNG")
    return out


def record_mock_generation(
    conn,
    *,
    row: PhenotypeRow,
    model: str,
    prompt_hash: str,
    prompt_text: str,
) -> Path:
    persist_prompt(row.visual_id, prompt_text, prompt_hash)
    output = write_mock_draft_image(row)
    add_attempt(
        conn,
        visual_id=row.visual_id,
        status="needs_review",
        model=model,
        prompt_hash=prompt_hash,
        output_path=str(output.relative_to(PIPELINE_ROOT)),
        cost_estimate_usd=0.0,
        metadata={"mock": True},
    )
    return output


def _reference_ids_for_row(row: PhenotypeRow) -> list[str]:
    ids = ["master/classic-fawn-solid-master-v2"]
    if row.coat_type == "short":
        ids.append("anchor/standard")
    elif row.coat_type == "fluffy":
        ids.append("anchor/fluffy")
    else:
        ids.append("anchor/hairless")
    if row.big_rope:
        # Prefer Big Rope conformation reference immediately after coat identity.
        ids.append("anchor/big-rope-standard")
    overlays = set(row.resolved_visible_traits.visible_pattern_placement)
    # Coated pattern refs fight Hairless skin-only look; keep those as prompt traits only.
    if row.coat_type != "hairless":
        if "merle-on-eumelanin-zones" in overlays or "merle-on-eumelanin-and-brindle-stripes" in overlays:
            ids.append("reference/merle-standard")
        if "representative-pied-map" in overlays:
            ids.append("reference/pied-map")
    deduped: list[str] = []
    for reference_id in ids:
        if reference_id not in deduped:
            deduped.append(reference_id)
    # For Big Rope jobs, put the Big Rope reference first so the edit prioritizes that fold.
    if row.big_rope and "anchor/big-rope-standard" in deduped:
        deduped = ["anchor/big-rope-standard"] + [x for x in deduped if x != "anchor/big-rope-standard"]
    return deduped


def resolve_reference_files(row: PhenotypeRow, registry: ReferenceRegistry) -> list[Path]:
    entries = {item.id: item for item in registry.references}
    required = _reference_ids_for_row(row)
    resolved: list[Path] = []
    missing: list[str] = []
    for reference_id in required:
        entry = entries.get(reference_id)
        if entry is None or not entry.approved:
            missing.append(reference_id)
            continue
        file_path = REPO_ROOT / entry.path
        if not file_path.exists():
            missing.append(reference_id)
            continue
        resolved.append(file_path)
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing or unapproved references for {row.visual_id}: {joined}")
    return resolved


def latest_raw_output(visual_id: str) -> Path | None:
    raw_dir = PIPELINE_ROOT / "outputs" / "raw" / visual_id
    if not raw_dir.exists():
        return None
    pngs = sorted(raw_dir.glob("*.png"))
    return pngs[-1] if pngs else None


def _decode_response_image(response) -> bytes:
    data = getattr(response, "data", None)
    if not data:
        raise RuntimeError("Image API response is missing data[]")
    first = data[0]
    b64_json = getattr(first, "b64_json", None)
    if b64_json:
        return base64.b64decode(b64_json)
    url = getattr(first, "url", None)
    if url:
        # GPT Image models typically return b64; URL fallback keeps the pipeline resilient.
        import urllib.request

        with urllib.request.urlopen(url, timeout=60) as handle:  # noqa: S310 - provider URL only
            return handle.read()
    raise RuntimeError("Image API response includes neither b64_json nor url output")


def validate_transparent_cutout(path: Path) -> None:
    with Image.open(path) as image:
        if image.mode not in {"RGBA", "LA"} and "A" not in image.getbands():
            raise RuntimeError("Generated image is missing alpha channel transparency.")
        rgba = image.convert("RGBA")
        width, height = rgba.size
        samples = [
            rgba.getpixel((1, 1))[3],
            rgba.getpixel((width - 2, 1))[3],
            rgba.getpixel((1, height - 2))[3],
            rgba.getpixel((width - 2, height - 2))[3],
            rgba.getpixel((width // 2, 1))[3],
            rgba.getpixel((1, height // 2))[3],
        ]
        if any(alpha > 8 for alpha in samples):
            raise RuntimeError(
                "Generated cutout has non-transparent exterior pixels "
                f"(corner/edge alpha samples={samples}). Rejecting corrupted background."
            )


def record_live_generation(
    conn,
    *,
    row: PhenotypeRow,
    model: str,
    prompt_hash: str,
    prompt_text: str,
    size: str,
    quality: str,
    registry: ReferenceRegistry,
    api_key: str,
    api_project: str | None,
    edit_from_latest: bool = False,
    extra_reference_paths: list[Path] | None = None,
) -> Path:
    from openai import OpenAI  # imported lazily to avoid mandatory import in pure offline checks

    persist_prompt(row.visual_id, prompt_text, prompt_hash)
    if edit_from_latest:
        latest = latest_raw_output(row.visual_id)
        if latest is None:
            raise RuntimeError(f"No previous raw output found to surgically edit for {row.visual_id}")
        # Surgical corrections: edit the current draft only (+ optional anatomy guides).
        references = [latest]
    else:
        references = resolve_reference_files(row, registry)
    if extra_reference_paths:
        for path in extra_reference_paths:
            if path.exists() and path.resolve() not in {item.resolve() for item in references}:
                references.append(path)

    client = OpenAI(api_key=api_key, project=api_project or None)

    with ExitStack() as stack:
        images = [stack.enter_context(path.open("rb")) for path in references]
        # GPT Image 2.5 edit rejects legacy response_format; omit unsupported params.
        response = client.images.edit(
            model=model,
            prompt=prompt_text,
            image=images,
            size=size,
            quality=quality,
            n=1,
            background="transparent",
            output_format="png",
        )

    png_bytes = _decode_response_image(response)
    stamp = now_iso().replace(":", "").replace("+00:00", "Z")
    output = PIPELINE_ROOT / "outputs" / "raw" / row.visual_id / f"{stamp}.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(png_bytes)
    try:
        validate_transparent_cutout(output)
    except RuntimeError:
        # Keep the bad file for debugging, but do not accept it as reviewable success.
        add_attempt(
            conn,
            visual_id=row.visual_id,
            status="technical_failed",
            model=model,
            prompt_hash=prompt_hash,
            output_path=str(output.relative_to(PIPELINE_ROOT)),
            cost_estimate_usd=0.0,
            metadata={
                "mock": False,
                "references": [path.as_posix() for path in references],
                "edit_from_latest": edit_from_latest,
                "error": "corrupted_transparent_background",
            },
        )
        raise

    usage = getattr(response, "usage", None)
    usage_payload = usage.model_dump() if usage and hasattr(usage, "model_dump") else None
    add_attempt(
        conn,
        visual_id=row.visual_id,
        status="needs_review",
        model=model,
        prompt_hash=prompt_hash,
        output_path=str(output.relative_to(PIPELINE_ROOT)),
        cost_estimate_usd=0.0,
        metadata={
            "mock": False,
            "references": [path.as_posix() for path in references],
            "usage": usage_payload,
            "edit_from_latest": edit_from_latest,
        },
    )
    return output

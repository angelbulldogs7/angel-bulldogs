from __future__ import annotations

from pathlib import Path

from .io import PIPELINE_ROOT, STATE_DB_PATH
from .models import PhenotypeRow
from .state import connect, init_db


def _latest_attempt_paths() -> dict[str, str]:
    """Map visual_id -> relative path of the latest generated attempt file."""
    if not STATE_DB_PATH.exists():
        return {}
    conn = connect(STATE_DB_PATH)
    init_db(conn)
    rows = conn.execute(
        """
        SELECT visual_id, output_path
        FROM attempts
        WHERE output_path IS NOT NULL
          AND status IN ('needs_review', 'generated', 'approved', 'exported', 'rejected')
        ORDER BY attempt_no DESC
        """
    ).fetchall()
    latest: dict[str, str] = {}
    for row in rows:
        visual_id = str(row["visual_id"])
        if visual_id in latest:
            continue
        latest[visual_id] = str(row["output_path"])
    return latest


def _resolve_preview_path(row: PhenotypeRow, attempt_paths: dict[str, str]) -> Path | None:
    # Prefer latest generated attempt (raw/draft), then approved export path.
    candidates: list[Path] = []
    attempt = attempt_paths.get(row.visual_id)
    if attempt:
        candidates.append(PIPELINE_ROOT / attempt)
    candidates.append(PIPELINE_ROOT / row.output_relative_path)
    raw_dir = PIPELINE_ROOT / "outputs" / "raw" / row.visual_id
    if raw_dir.exists():
        pngs = sorted(raw_dir.glob("*.png"), reverse=True)
        candidates.extend(pngs)
    for path in candidates:
        if path.exists() and path.is_file():
            return path
    return None


def build_review_gallery(rows: list[PhenotypeRow], html_path: Path) -> None:
    attempt_paths = _latest_attempt_paths()
    cards: list[str] = []
    for row in rows:
        preview = _resolve_preview_path(row, attempt_paths)
        exists = preview is not None
        source = ""
        shown_path = row.output_relative_path
        if preview is not None:
            # Paths relative to outputs/review/gallery.html (sibling folders under outputs/)
            source = Path("..") / preview.relative_to(PIPELINE_ROOT / "outputs")
            source = source.as_posix()
            shown_path = preview.relative_to(PIPELINE_ROOT).as_posix()
        for theme, bg in [("white", "#ffffff"), ("dark", "#1f1f1f"), ("ivory", "#f8f2e6")]:
            cards.append(
                f"""
                <article class="card">
                  <h3>{row.visual_id} <small>({theme})</small></h3>
                  <p>{row.public_name}</p>
                  <p><code>{shown_path}</code></p>
                  <div class="frame" style="background:{bg}">
                    {f'<img src="{source}" alt="{row.alt_text}">' if exists else '<span class="missing">Image not generated yet</span>'}
                  </div>
                </article>
                """
            )
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Color Lab Review Gallery</title>
    <style>
      body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 1.5rem; }}
      .grid {{ display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 1rem; }}
      .card {{ border: 1px solid #ddd; border-radius: 10px; padding: 0.75rem; }}
      .frame {{ border: 1px solid #bbb; border-radius: 8px; height: 260px; display: grid; place-items: center; overflow: hidden; }}
      img {{ max-width: 100%; max-height: 100%; object-fit: contain; }}
      .missing {{ color: #666; font-size: 0.9rem; }}
      code {{ font-size: 0.78rem; }}
    </style>
  </head>
  <body>
    <h1>Color Lab Review Gallery</h1>
    <p>This gallery is static and read-only; decisions persist via CLI commands.</p>
    <p>Previews prefer latest generated files under <code>outputs/raw/</code>. Approved WebP exports appear after <code>export</code>.</p>
    <section class="grid">
      {"".join(cards)}
    </section>
  </body>
</html>
"""
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(html, encoding="utf-8")

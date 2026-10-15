#!/usr/bin/env python3
"""Export EVERY Final Stenci photo for the Angel Bulldogs site.

Rules:
- Include all JPG/JPEG files and embedded JPEG previews from every ARW.
- Never crop the subject out: fit the full image into the target canvas with
  cream padding (contain), centered.
- Finder Blue-tagged shots come first (primary / early gallery), then the rest
  in filename order.
"""

from __future__ import annotations

import json
import plistlib
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path("/Users/mojsa/Desktop/Puppy Website")
STENCI = Path("/Users/mojsa/Desktop/Final Stenci")
ARW_CACHE = ROOT / "tmp/stenci-arw-jpg"
OUT = ROOT / "public/images"
MANIFEST = ROOT / "tmp/stenci-export-manifest.json"
JPEG_QUALITY = 88
PAD = (245, 240, 232)

# Known Blue tags from the Final Stenci set (Finder tags). Used when xattr is unavailable.
KNOWN_BLUE = {
    "Aspy/DSC03500.JPG",
    "Aspy/DSC03502.ARW",
    "Aspy/DSC03722.JPG",
    "Bella/DSC03989.JPG",
    "Bella/DSC04004.ARW",
    "Bella/DSC04020.ARW",
    "Bella/DSC04035.JPG",
    "Bella/DSC04037.ARW",
    "Bella/DSC04040.JPG",
    "Chloe/DSC03268.JPG",
    "Chloe/DSC03270.ARW",
    "Chloe/DSC03308.JPG",
    "Hami/DSC03169.JPG",
    "Hami/DSC03170.JPG",
    "Hami/DSC03171.JPG",
    "Hami/DSC03172.JPG",
    "Hami/DSC03186.JPG",
    "Litter 1/DSC03963.JPG",
    "Litter 1/DSC04014.JPG",
    "Litter 1/DSC04017.JPG",
    "Romeo/DSC03378.JPG",
    "Romeo/DSC03484.JPG",
    "Romeo/DSC03489.JPG",
    "coco/DSC03894.ARW",
    "coco/DSC03902.ARW",
    "coco/DSC03903.ARW",
    "coco/DSC03906.ARW",
}

# Folder on disk -> site slug / output dir / canvas
DOG_SPECS: dict[str, dict] = {
    "Aspy": {
        "slug": "aspy",
        "out": "puppies/aspy",
        "size": (800, 1000),
        "kind": "puppy",
        "preferred_primary": "DSC03722.JPG",
    },
    "Chloe": {
        "slug": "chloe",
        "out": "puppies/chloe",
        "size": (800, 1000),
        "kind": "puppy",
        "preferred_primary": "DSC03308.JPG",
    },
    "coco": {
        "slug": "coco",
        "out": "puppies/coco",
        "size": (800, 1000),
        "kind": "puppy",
        "preferred_primary": "DSC03894.ARW",
    },
    "Hami": {
        "slug": "hamilton",
        "out": "puppies/hamilton",
        "size": (800, 1000),
        "kind": "puppy",
        # Full-body blue shot — DSC03171 is a tight face crop in-camera.
        "preferred_primary": "DSC03186.JPG",
    },
    "Romeo": {
        "slug": "romeo",
        "out": "puppies/romeo",
        "size": (800, 1000),
        "kind": "puppy",
        "preferred_primary": "DSC03489.JPG",
    },
    "Litter 1": {
        "slug": "litter-1",
        "out": "puppies/litter-1",
        "size": (1600, 1200),
        "kind": "litter",
        "preferred_primary": "DSC03963.JPG",
    },
    "Bella": {
        "slug": "bella",
        "out": "bella",
        "size": (1200, 800),
        "kind": "bella",
        "preferred_primary": "DSC04040.JPG",
    },
}


def load(path: Path) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def extract_largest_jpeg(arw: Path, dest: Path) -> Path:
    data = arw.read_bytes()
    starts: list[int] = []
    i = 0
    while True:
        j = data.find(b"\xff\xd8\xff", i)
        if j < 0:
            break
        starts.append(j)
        i = j + 1
    best: bytes | None = None
    for start in starts:
        end = data.find(b"\xff\xd9", start + 2)
        if end < 0:
            continue
        chunk = data[start : end + 2]
        if best is None or len(chunk) > len(best):
            best = chunk
    if not best:
        raise SystemExit(f"no embedded JPEG in {arw}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(best)
    return dest


def resolve_source(path: Path) -> Path:
    if path.suffix.lower() != ".arw":
        return path
    dest = ARW_CACHE / f"{path.parent.name}-{path.stem}.jpg"
    if not dest.exists() or dest.stat().st_mtime < path.stat().st_mtime:
        extract_largest_jpeg(path, dest)
        print(f"extracted {dest.relative_to(ROOT)}")
    return dest


def finder_tags(path: Path) -> list[str]:
    rel = f"{path.parent.name}/{path.name}"
    try:
        xa = subprocess.check_output(
            ["xattr", "-p", "com.apple.metadata:_kMDItemUserTags", str(path)],
            stderr=subprocess.DEVNULL,
        )
        tags = plistlib.loads(xa)
        if isinstance(tags, list) and tags:
            return [re.sub(r"\n\d+$", "", str(t)) for t in tags]
    except Exception:
        pass
    try:
        raw = subprocess.check_output(
            ["mdls", "-raw", "-name", "kMDItemUserTags", str(path)],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        found = re.findall(r"\b(Blue|Red|Orange|Purple|Green|Yellow|Gray)\b", raw)
        if found:
            return found
    except Exception:
        pass
    if rel in KNOWN_BLUE:
        return ["Blue"]
    return []


def fit_contain(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Scale the full image to fit inside the canvas. Never crops the subject."""
    tw, th = size
    scale = min(tw / img.width, th / img.height)
    nw = max(1, int(round(img.width * scale)))
    nh = max(1, int(round(img.height * scale)))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, PAD)
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def export(img: Image.Image, dest: Path, size: tuple[int, int]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    fit_contain(img, size).save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    print(f"wrote {dest.relative_to(ROOT)} ({size[0]}x{size[1]})")


def list_sources(folder: str, preferred_primary: str | None = None) -> list[Path]:
    src_dir = STENCI / folder
    files = [
        p
        for p in src_dir.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".arw"} and p.is_file()
    ]

    def sort_key(p: Path) -> tuple[int, int, str]:
        tags = finder_tags(p)
        blue = 0 if "Blue" in tags else 1
        preferred = 0 if preferred_primary and p.name == preferred_primary else 1
        return (preferred, blue, p.name.lower())

    return sorted(files, key=sort_key)


def bella_size_for(index: int, total: int) -> tuple[int, int]:
    # First (blue portrait preference): 4:5 portrait; rest: 3:2 lifestyle.
    if index == 0:
        return (800, 1000)
    return (1200, 800)


def litter_size_for(index: int) -> tuple[int, int]:
    if index == 0:
        return (1600, 1200)
    return (1200, 900)


def clear_outputs() -> None:
    for folder in (OUT / "puppies", OUT / "bella"):
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                path.unlink()


def main() -> None:
    clear_outputs()
    manifest: dict[str, list[dict]] = {}

    for folder, spec in DOG_SPECS.items():
        sources = list_sources(folder, spec.get("preferred_primary"))
        if not sources:
            raise SystemExit(f"no sources in {folder}")
        entries: list[dict] = []
        for i, src in enumerate(sources):
            tags = finder_tags(src)
            resolved = resolve_source(src)
            img = load(resolved)
            if spec["kind"] == "bella":
                size = bella_size_for(i, len(sources))
                if i == 0:
                    name = "portrait.jpg"
                elif i == 1:
                    name = "lifestyle.jpg"
                else:
                    name = f"home-{i - 1:02d}.jpg"
            elif spec["kind"] == "litter":
                size = litter_size_for(i)
                name = "hero.jpg" if i == 0 else f"gallery-{i:02d}.jpg"
            else:
                size = spec["size"]
                name = "primary.jpg" if i == 0 else f"gallery-{i:02d}.jpg"

            dest = OUT / spec["out"] / name
            export(img, dest, size)
            entries.append(
                {
                    "source": f"{folder}/{src.name}",
                    "tags": tags,
                    "blue": "Blue" in tags,
                    "dest": f"/images/{spec['out']}/{name}",
                    "width": size[0],
                    "height": size[1],
                    "index": i,
                }
            )
        manifest[spec["slug"]] = entries
        print(f"{folder}: {len(entries)} photos (blue first: {[e['source'] for e in entries if e['blue']]})")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Export puppy photos for Angel Bulldogs.

Order per puppy:
1. Final Stenci photos (Blue-tagged preferred primary first)
2. Old original-site photos from tmp/puppy-source (always last)

All exports use fit-contain into a 4:3 cream canvas so the FULL photo is
visible. Filenames are versioned (v3-*) to bust CDN/browser caches of older
cropped primary.jpg / gallery-*.jpg assets.
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
OLD_SRC = ROOT / "tmp/puppy-source"
ARW_CACHE = ROOT / "tmp/stenci-arw-jpg"
OUT = ROOT / "public/images"
MANIFEST = ROOT / "tmp/stenci-export-manifest.json"
JPEG_QUALITY = 88
PAD = (245, 240, 232)
# 4:3 — matches the “whole photo” letterbox look families prefer on cards.
PUPPY_SIZE = (1200, 900)
VERSION = "v3"

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

# Prefer fuller-body Blue shots as card leads (not ultra-tight face crops).
PUPPIES: dict[str, dict] = {
    "Aspy": {"slug": "aspy", "old": "Aspy", "preferred_primary": "DSC03500.JPG"},
    "Chloe": {"slug": "chloe", "old": "Chloe", "preferred_primary": "DSC03268.JPG"},
    "coco": {"slug": "coco", "old": "Coco", "preferred_primary": "DSC03903.ARW"},
    "Hami": {"slug": "hamilton", "old": "Hamilton", "preferred_primary": "DSC03186.JPG"},
    "Romeo": {"slug": "romeo", "old": "Romeo", "preferred_primary": "DSC03378.JPG"},
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


def list_stenci(folder: str, preferred_primary: str | None) -> list[Path]:
    files = [
        p
        for p in (STENCI / folder).iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".arw"} and p.is_file()
    ]

    def sort_key(p: Path) -> tuple[int, int, str]:
        tags = finder_tags(p)
        blue = 0 if "Blue" in tags else 1
        preferred = 0 if preferred_primary and p.name == preferred_primary else 1
        return (preferred, blue, p.name.lower())

    return sorted(files, key=sort_key)


def list_old(old_folder: str) -> list[Path]:
    src = OLD_SRC / old_folder
    if not src.exists():
        return []
    return sorted(p for p in src.iterdir() if p.suffix.lower() in {".jpg", ".jpeg"} and p.is_file())


def clear_dir(path: Path) -> None:
    if not path.exists():
        return
    for file in path.rglob("*"):
        if file.is_file() and file.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            file.unlink()


def export_litter_and_bella() -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}

    litter_out = OUT / "puppies/litter-1"
    clear_dir(litter_out)
    litter_entries: list[dict] = []
    for i, src in enumerate(list_stenci("Litter 1", "DSC03963.JPG")):
        size = (1600, 1200) if i == 0 else (1200, 900)
        name = f"{VERSION}-hero.jpg" if i == 0 else f"{VERSION}-s-{i:02d}.jpg"
        export(load(resolve_source(src)), litter_out / name, size)
        litter_entries.append(
            {
                "source": f"Litter 1/{src.name}",
                "group": "stenci",
                "blue": "Blue" in finder_tags(src),
                "dest": f"/images/puppies/litter-1/{name}",
                "width": size[0],
                "height": size[1],
            }
        )
    for j, src in enumerate(list_old("Litter1"), start=1):
        name = f"{VERSION}-o-{j:02d}.jpg"
        export(load(src), litter_out / name, (1200, 900))
        litter_entries.append(
            {
                "source": f"old/Litter1/{src.name}",
                "group": "old",
                "blue": False,
                "dest": f"/images/puppies/litter-1/{name}",
                "width": 1200,
                "height": 900,
            }
        )
    result["litter-1"] = litter_entries

    bella_out = OUT / "bella"
    clear_dir(bella_out)
    bella_entries: list[dict] = []
    for i, src in enumerate(list_stenci("Bella", "DSC04040.JPG")):
        size = (800, 1000) if i == 0 else (1200, 800)
        if i == 0:
            name = f"{VERSION}-portrait.jpg"
        elif i == 1:
            name = f"{VERSION}-lifestyle.jpg"
        else:
            name = f"{VERSION}-home-{i - 1:02d}.jpg"
        export(load(resolve_source(src)), bella_out / name, size)
        bella_entries.append(
            {
                "source": f"Bella/{src.name}",
                "group": "stenci",
                "blue": True,
                "dest": f"/images/bella/{name}",
                "width": size[0],
                "height": size[1],
            }
        )
    result["bella"] = bella_entries
    return result


def main() -> None:
    manifest: dict[str, list[dict]] = {}

    for folder, spec in PUPPIES.items():
        slug = spec["slug"]
        out_dir = OUT / "puppies" / slug
        clear_dir(out_dir)
        entries: list[dict] = []

        stenci_files = list_stenci(folder, spec.get("preferred_primary"))
        for i, src in enumerate(stenci_files, start=1):
            name = f"{VERSION}-primary.jpg" if i == 1 else f"{VERSION}-s-{i - 1:02d}.jpg"
            export(load(resolve_source(src)), out_dir / name, PUPPY_SIZE)
            entries.append(
                {
                    "source": f"{folder}/{src.name}",
                    "group": "stenci",
                    "blue": "Blue" in finder_tags(src),
                    "dest": f"/images/puppies/{slug}/{name}",
                    "width": PUPPY_SIZE[0],
                    "height": PUPPY_SIZE[1],
                }
            )

        for j, src in enumerate(list_old(spec["old"]), start=1):
            name = f"{VERSION}-o-{j:02d}.jpg"
            export(load(src), out_dir / name, PUPPY_SIZE)
            entries.append(
                {
                    "source": f"old/{spec['old']}/{src.name}",
                    "group": "old",
                    "blue": False,
                    "dest": f"/images/puppies/{slug}/{name}",
                    "width": PUPPY_SIZE[0],
                    "height": PUPPY_SIZE[1],
                }
            )

        manifest[slug] = entries
        stenci_n = sum(1 for e in entries if e["group"] == "stenci")
        old_n = sum(1 for e in entries if e["group"] == "old")
        print(f"{slug}: {stenci_n} Final Stenci + {old_n} old = {len(entries)} lead={entries[0]['source']}")

    manifest.update(export_litter_and_bella())
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"wrote {MANIFEST.relative_to(ROOT)}")
    print("TOTAL", sum(len(v) for v in manifest.values()))


if __name__ == "__main__":
    main()

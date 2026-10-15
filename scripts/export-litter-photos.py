#!/usr/bin/env python3
"""Export Final Stenci litter photos for the Angel Bulldogs site.

Order rule: Finder Blue-tagged shots first (hero / primary), then the best
remaining angles (three-quarter, profile, personality). Coco Blue picks live
on ARW files — embedded JPEG previews are extracted automatically.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path("/Users/mojsa/Desktop/Puppy Website")
STENCI = Path("/Users/mojsa/Desktop/Final Stenci")
ARW_CACHE = ROOT / "tmp/stenci-arw-jpg"
OUT = ROOT / "public/images"
JPEG_QUALITY = 88
PAD = (245, 240, 232)


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


def resolve_source(rel: str) -> Path:
    """Resolve a Final Stenci path; ARW files become cached JPEG previews."""
    src = STENCI / rel
    if not src.exists():
        raise SystemExit(f"missing {src}")
    if src.suffix.lower() == ".arw":
        dest = ARW_CACHE / f"{src.parent.name}-{src.stem}.jpg"
        if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
            extract_largest_jpeg(src, dest)
            print(f"extracted {dest.relative_to(ROOT)}")
        return dest
    return src


def crop_to_ratio(img: Image.Image, ratio_w: int, ratio_h: int, focus_x: float, focus_y: float) -> Image.Image:
    w, h = img.size
    target = ratio_w / ratio_h
    current = w / h
    if abs(current - target) < 0.01:
        return img
    if current > target:
        new_w = int(round(h * target))
        new_h = h
    else:
        new_w = w
        new_h = int(round(w / target))
    left = int(round(focus_x * w - new_w / 2))
    top = int(round(focus_y * h - new_h / 2))
    left = max(0, min(left, w - new_w))
    top = max(0, min(top, h - new_h))
    return img.crop((left, top, left + new_w, top + new_h))


def export(img: Image.Image, dest: Path, size: tuple[int, int]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    out = img.resize(size, Image.Resampling.LANCZOS)
    if out.size != size:
        canvas = Image.new("RGB", size, PAD)
        canvas.paste(out, ((size[0] - out.width) // 2, (size[1] - out.height) // 2))
        out = canvas
    out.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    print(f"wrote {dest.relative_to(ROOT)} ({size[0]}x{size[1]})")


def export_with_top_breathing(
    img: Image.Image,
    dest: Path,
    size: tuple[int, int],
    top_frac: float = 0.045,
) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tw, th = size
    pad_top = int(round(th * top_frac))
    avail_h = th - pad_top
    scale = max(tw / img.width, avail_h / img.height)
    nw = int(round(img.width * scale))
    nh = int(round(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (tw - nw) // 2
    top = pad_top + (avail_h - nh) // 2
    if nh > avail_h:
        top = pad_top
        resized = resized.crop((0, 0, nw, avail_h))
        nh = avail_h
    if nw > tw:
        x0 = (nw - tw) // 2
        resized = resized.crop((x0, 0, x0 + tw, nh))
        left = 0
        nw = tw
    canvas = Image.new("RGB", size, PAD)
    canvas.paste(resized, (left, top))
    canvas.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    print(f"wrote {dest.relative_to(ROOT)} ({size[0]}x{size[1]}, top pad)")


# source_rel, dest_rel, aspect, focus_x, focus_y, size, top_breathing
Job = tuple[str, str, tuple[int, int], float, float, tuple[int, int], bool]

JOBS: list[Job] = [
    # Aspy — Blue first: eye-contact close-up, then three-quarter; then best Red angles
    ("Aspy/DSC03722.JPG", "puppies/aspy/primary.jpg", (4, 5), 0.52, 0.42, (800, 1000), False),
    ("Aspy/DSC03500.JPG", "puppies/aspy/gallery-01.jpg", (4, 5), 0.50, 0.48, (800, 1000), False),
    ("Aspy/DSC03699.JPG", "puppies/aspy/gallery-02.jpg", (4, 5), 0.50, 0.45, (800, 1000), False),
    ("Aspy/DSC03490.JPG", "puppies/aspy/gallery-03.jpg", (4, 5), 0.48, 0.50, (800, 1000), False),
    # Chloe — Blue first: portrait + sitting; then best Orange angles
    ("Chloe/DSC03308.JPG", "puppies/chloe/primary.jpg", (4, 5), 0.55, 0.42, (800, 1000), False),
    ("Chloe/DSC03268.JPG", "puppies/chloe/gallery-01.jpg", (4, 5), 0.50, 0.48, (800, 1000), False),
    ("Chloe/DSC03267.JPG", "puppies/chloe/gallery-02.jpg", (4, 5), 0.50, 0.48, (800, 1000), False),
    ("Chloe/DSC03309.JPG", "puppies/chloe/gallery-03.jpg", (4, 5), 0.52, 0.40, (800, 1000), False),
    # Coco — Blue ARW first (eye contact, profile, three-quarter); then best Purple JPG
    ("coco/DSC03894.ARW", "puppies/coco/primary.jpg", (4, 5), 0.50, 0.40, (800, 1000), True),
    ("coco/DSC03903.ARW", "puppies/coco/gallery-01.jpg", (4, 5), 0.52, 0.42, (800, 1000), True),
    ("coco/DSC03902.ARW", "puppies/coco/gallery-02.jpg", (4, 5), 0.52, 0.42, (800, 1000), True),
    ("coco/DSC03813.JPG", "puppies/coco/gallery-03.jpg", (4, 5), 0.50, 0.40, (800, 1000), True),
    # Hamilton (Hami) — Blue first; then full-body Purple
    ("Hami/DSC03171.JPG", "puppies/hamilton/primary.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    ("Hami/DSC03186.JPG", "puppies/hamilton/gallery-01.jpg", (4, 5), 0.50, 0.48, (800, 1000), False),
    ("Hami/DSC03172.JPG", "puppies/hamilton/gallery-02.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    ("Hami/DSC03177.JPG", "puppies/hamilton/gallery-03.jpg", (4, 5), 0.50, 0.45, (800, 1000), False),
    # Romeo — Blue first; then best sitting Orange personality
    ("Romeo/DSC03489.JPG", "puppies/romeo/primary.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    ("Romeo/DSC03484.JPG", "puppies/romeo/gallery-01.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    ("Romeo/DSC03378.JPG", "puppies/romeo/gallery-02.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    ("Romeo/DSC03476.JPG", "puppies/romeo/gallery-03.jpg", (4, 5), 0.50, 0.42, (800, 1000), False),
    # Litter 1 free photos — all Blue: group hero, then Bella + puppy moments
    ("Litter 1/DSC03963.JPG", "puppies/litter-1/hero.jpg", (4, 3), 0.50, 0.52, (1600, 1200), False),
    ("Litter 1/DSC04014.JPG", "puppies/litter-1/gallery-01.jpg", (4, 3), 0.48, 0.48, (1200, 900), False),
    ("Litter 1/DSC04017.JPG", "puppies/litter-1/gallery-02.jpg", (4, 3), 0.50, 0.48, (1200, 900), False),
    # Bella — all Blue; portrait first, then lifestyle / home set
    ("Bella/DSC04040.JPG", "bella/portrait.jpg", (4, 5), 0.50, 0.40, (800, 1000), False),
    ("Bella/DSC03989.JPG", "bella/lifestyle.jpg", (3, 2), 0.48, 0.42, (1200, 800), False),
    ("Bella/DSC04035.JPG", "bella/home-01.jpg", (3, 2), 0.48, 0.38, (1200, 800), False),
    ("Litter 1/DSC04014.JPG", "bella/home-02.jpg", (3, 2), 0.48, 0.45, (1200, 800), False),
    ("Litter 1/DSC04017.JPG", "bella/home-03.jpg", (3, 2), 0.50, 0.45, (1200, 800), False),
]


def main() -> None:
    puppies_out = OUT / "puppies"
    bella_out = OUT / "bella"
    for folder in (puppies_out, bella_out):
        if folder.exists():
            for path in folder.rglob("*"):
                if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    path.unlink()

    for src_rel, dest_rel, aspect, fx, fy, size, top_breathing in JOBS:
        src = resolve_source(src_rel)
        cropped = crop_to_ratio(load(src), aspect[0], aspect[1], fx, fy)
        dest = OUT / dest_rel
        if top_breathing:
            export_with_top_breathing(cropped, dest, size)
        else:
            export(cropped, dest, size)


if __name__ == "__main__":
    main()

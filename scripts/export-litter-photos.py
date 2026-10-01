#!/usr/bin/env python3
"""Export litter photos: full dog in frame, minimal empty space."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path("/Users/mojsa/Desktop/Puppy Website")
SRC = ROOT / "tmp/puppy-source"
OUT = ROOT / "public/images/puppies"
JPEG_QUALITY = 88
PAD = (245, 240, 232)


def load(path: Path) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def crop_to_ratio(img: Image.Image, ratio_w: int, ratio_h: int, focus_x: float, focus_y: float) -> Image.Image:
    """Crop to target ratio around a focus point, keeping as much of the subject as possible."""
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
    # Tiny cream pad if rounding left a 1px mismatch — never stretch-crop the dog.
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
    """Leave a little cream above the dog so tall ears aren't flush to the edge."""
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


# source, dest, aspect, focus_x, focus_y, size, top_breathing
Job = tuple[str, str, tuple[int, int], float, float, tuple[int, int], bool]
JOBS: list[Job] = [
    ("Aspy/02.jpg", "aspy/primary.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Aspy/01.jpg", "aspy/gallery-01.jpg", (4, 5), 0.48, 0.58, (800, 1000), False),
    ("Aspy/03.jpg", "aspy/gallery-02.jpg", (4, 5), 0.52, 0.58, (800, 1000), False),
    ("Chloe/02.jpg", "chloe/primary.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Chloe/01.jpg", "chloe/gallery-01.jpg", (4, 5), 0.50, 0.60, (800, 1000), False),
    # Standing profile: prior focus sat too low and clipped her ears.
    ("Chloe/03.jpg", "chloe/gallery-02.jpg", (4, 5), 0.52, 0.40, (800, 1000), False),
    ("Coco/01.jpg", "coco/primary.jpg", (4, 5), 0.48, 0.36, (800, 1000), True),
    ("Coco/02.jpg", "coco/gallery-01.jpg", (4, 5), 0.48, 0.36, (800, 1000), True),
    ("Coco/03.jpg", "coco/gallery-02.jpg", (4, 5), 0.50, 0.36, (800, 1000), True),
    ("Coco/04.jpg", "coco/gallery-03.jpg", (4, 5), 0.50, 0.36, (800, 1000), True),
    ("Hamilton/01.jpg", "hamilton/primary.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Hamilton/02.jpg", "hamilton/gallery-01.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Hamilton/03.jpg", "hamilton/gallery-02.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Hamilton/04.jpg", "hamilton/gallery-03.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    ("Romeo/01.jpg", "romeo/primary.jpg", (4, 5), 0.50, 0.48, (800, 1000), False),
    ("Romeo/02.jpg", "romeo/gallery-01.jpg", (4, 5), 0.48, 0.55, (800, 1000), False),
    ("Romeo/03.jpg", "romeo/gallery-02.jpg", (4, 5), 0.50, 0.58, (800, 1000), False),
    # Standing shot: prior focus sat too low and clipped his ears.
    ("Romeo/04.jpg", "romeo/gallery-03.jpg", (4, 5), 0.50, 0.38, (800, 1000), False),
    ("Litter1/01.jpg", "litter-1/hero.jpg", (4, 3), 0.50, 0.52, (1600, 1200), False),
    ("Litter1/02.jpg", "litter-1/gallery-01.jpg", (4, 3), 0.50, 0.48, (1200, 900), False),
    ("Litter1/03.jpg", "litter-1/gallery-02.jpg", (4, 3), 0.50, 0.50, (1200, 900), False),
    ("Litter1/04.jpg", "litter-1/gallery-03.jpg", (4, 3), 0.50, 0.50, (1200, 900), False),
    ("Litter1/05.jpg", "litter-1/gallery-04.jpg", (4, 3), 0.50, 0.50, (1200, 900), False),
    ("Litter1/06.jpg", "litter-1/gallery-05.jpg", (4, 3), 0.50, 0.50, (1200, 900), False),
]


def main() -> None:
    if OUT.exists():
        for path in OUT.rglob("*"):
            if path.is_file():
                path.unlink()
    for src_rel, dest_rel, aspect, fx, fy, size, top_breathing in JOBS:
        src = SRC / src_rel
        if not src.exists():
            raise SystemExit(f"missing {src}")
        cropped = crop_to_ratio(load(src), aspect[0], aspect[1], fx, fy)
        if top_breathing:
            export_with_top_breathing(cropped, OUT / dest_rel, size)
        else:
            export(cropped, OUT / dest_rel, size)


if __name__ == "__main__":
    main()

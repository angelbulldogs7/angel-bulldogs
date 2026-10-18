#!/usr/bin/env python3
"""Export Bella story media for Angel Bulldogs.

Non-destructive: never clears public/images/bella/. Accepts explicit --source
and --out. Converts HEIC/JPG with orientation normalization, writes native-ratio
JPEG derivatives (preview + viewer), a silent H.264 monastery MP4, inventory
JSON, and a local contact sheet.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path("/Users/mojsa/Desktop/Bella iz mladjih dana")
DEFAULT_OUT = ROOT / "public" / "images" / "bella"
DEFAULT_INVENTORY = ROOT / "docs" / "bella-media-inventory.json"
DEFAULT_CONTACT = ROOT / "reports" / "bella-media-contact-sheet.jpg"
JPEG_QUALITY = 86
PREVIEW_MAX = 900
VIEWER_MAX = 1800
PAD = (245, 240, 232)


@dataclass(frozen=True)
class SourceSpec:
    media_id: str
    relative_source: str
    album: str
    order: int
    caption: str
    alt: str
    roles: tuple[str, ...]
    kind: str = "photo"  # photo | video | existing


# Deliberate album order: vary pose/setting; keep similar seated shots apart.
SOURCES: list[SourceSpec] = [
    # Younger days — previews: seated, belly rub, sleeping
    SourceSpec("Y03", "mala bella/FullSizeRender 3.HEIC", "younger-days", 1, "Sitting as a puppy", "Young Bella sitting on a rug and looking toward the camera", ("album", "preview"),),
    SourceSpec("Y05", "mala bella/FullSizeRender.HEIC", "younger-days", 2, "Belly rubs", "Young Bella on her back enjoying belly rubs", ("album", "preview"),),
    SourceSpec("Y07", "mala bella/lp_image.HEIC", "younger-days", 3, "A quiet nap", "Young Bella sleeping with her head and front paws visible", ("album", "preview"),),
    SourceSpec("Y01", "mala bella/FCC56155-D30F-4040-A817-C3F111031D6C.JPG", "younger-days", 4, "Early portrait", "Young Bella sitting and looking toward the camera", ("album", "homepage-support"),),
    SourceSpec("Y04", "mala bella/FullSizeRender 5.HEIC", "younger-days", 5, "In the sunlight", "A hand gently holding young Bella's head in sunlight", ("album",),),
    SourceSpec("Y02", "mala bella/FullSizeRender 2.HEIC", "younger-days", 6, "Lying down", "Young Bella lying down on a soft blanket", ("album",),),
    SourceSpec("Y06", "mala bella/IMG_5713.HEIC", "younger-days", 7, "On the floor", "Young Bella sitting on the floor farther from the camera", ("album",),),
    # Little celebrations — birthday + snow as previews; tree shots separated
    SourceSpec("C01", "1 year birthday/B7FBFD8A-35BC-495D-8228-E001F2E6085A.HEIC", "little-celebrations", 1, "Her first birthday", "Bella wearing a birthday cap and looking at a small cake", ("album", "preview"),),
    SourceSpec("N01", "new years/IMG_0898.HEIC", "little-celebrations", 2, "New Year's memories", "Bella outdoors in the snow wearing a sweater", ("album", "preview"),),
    SourceSpec("N02", "new years/IMG_1782.HEIC", "little-celebrations", 3, "By the Christmas tree", "Bella sitting in side profile beside a Christmas tree", ("album",),),
    SourceSpec("N03", "new years/IMG_1794.HEIC", "little-celebrations", 4, "Asleep by the tree", "Bella sleeping beside a Christmas tree", ("album",),),
    # Everyday — interleave walks, Seb, sunset, and existing home photos
    SourceSpec("E05", "random/IMG_9624.HEIC", "everyday", 1, "Sunlit portrait", "Bella looking toward the camera in bright outdoor light", ("album", "preview", "story-portrait", "homepage-portrait"),),
    SourceSpec("E03", "random/IMG_3323.JPG", "everyday", 2, "With Seb", "Bella and Seb on the grass looking toward the camera", ("album", "preview", "homepage-support"),),
    SourceSpec("X01", "public/images/bella/v5-lifestyle.jpg", "everyday", 3, "At home", "Bella sitting on her bed at home", ("album", "existing"),),
    SourceSpec("E01", "random/FullSizeRender 4.HEIC", "everyday", 4, "On a walk", "Bella on a walk licking her nose", ("album",),),
    SourceSpec("X02", "public/images/bella/v5-home-01.jpg", "everyday", 5, "Family time", "Bella at home interacting with her family", ("album", "existing"),),
    SourceSpec("E02", "random/IMG_0813.JPG", "everyday", 6, "Sunset nap", "Bella sleeping on a bed in warm sunset light", ("album", "preview"),),
    SourceSpec("X03", "public/images/bella/v5-home-02.jpg", "everyday", 7, "On her bed", "Bella standing in profile on her bed", ("album", "existing"),),
    SourceSpec("E04", "random/IMG_9620.HEIC", "everyday", 8, "A walk outside", "Bella smiling toward the camera during a walk", ("album",),),
    SourceSpec("X04", "public/images/bella/v5-home-03.jpg", "everyday", 9, "Looking up", "Bella standing and looking upward on her bed", ("album", "existing"),),
    SourceSpec("X05", "public/images/bella/v5-portrait.jpg", "everyday", 10, "Earlier portrait", "Bella looking up at the camera from her bed", ("album", "existing", "legacy-portrait"),),
    SourceSpec("X06", "public/images/bella/v5-home-04.jpg", "everyday", 11, "Close at home", "Bella looking up toward the camera at home", ("album", "existing"),),
    # Serbia
    SourceSpec("S01", "at monastary/IMG_7508.HEIC", "serbia", 1, "A moment in Serbia", "Bella looking toward a monastery, with her ears in the foreground", ("album", "preview"),),
    SourceSpec("S02", "at monastary/IMG_7515.MOV", "serbia", 2, "Visiting a monastery", "Silent video of Bella at a monastery in Serbia, then a pan toward the building", ("album", "video"), "video"),
]

SLUGS = {
    "Y01": "young-portrait",
    "Y02": "lying-down",
    "Y03": "sitting",
    "Y04": "sunlight-hands",
    "Y05": "belly-rubs",
    "Y06": "sitting-farther",
    "Y07": "sleeping-close",
    "C01": "first-birthday",
    "N01": "snow-sweater",
    "N02": "christmas-tree",
    "N03": "asleep-by-tree",
    "E01": "walk-nose-lick",
    "E02": "sunset-nap",
    "E03": "with-seb",
    "E04": "walk-smile",
    "E05": "sunlit-portrait",
    "S01": "monastery-photo",
    "S02": "monastery-silent",
}


def short_hash(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()[:8]


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(cmd)}\n{result.stderr}")


def resolve_source(spec: SourceSpec, source_root: Path, project_root: Path) -> Path:
    if "existing" in spec.roles or spec.relative_source.startswith("public/"):
        path = project_root / spec.relative_source
    else:
        path = source_root / spec.relative_source
    if not path.exists():
        raise FileNotFoundError(f"Missing source for {spec.media_id}: {spec.relative_source}")
    return path


def heic_or_image_to_rgb(path: Path, work: Path) -> Image.Image:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return ImageOps.exif_transpose(Image.open(path)).convert("RGB")

    # Convert HEIC via sips, then bake EXIF orientation with Pillow.
    intermediate = work / f"{path.stem}-raw.jpg"
    run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "95", str(path), "--out", str(intermediate)])
    return ImageOps.exif_transpose(Image.open(intermediate)).convert("RGB")


def fit_max(image: Image.Image, max_edge: int) -> Image.Image:
    w, h = image.size
    longest = max(w, h)
    if longest <= max_edge:
        return image.copy()
    scale = max_edge / longest
    size = (max(1, round(w * scale)), max(1, round(h * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def save_jpeg(image: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def export_photo(spec: SourceSpec, source: Path, out_dir: Path, work: Path) -> dict:
    if "existing" in spec.roles:
        image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
        public_src = "/" + Path(spec.relative_source).as_posix().removeprefix("public/")
        w, h = image.size
        return {
            "id": spec.media_id,
            "kind": "photo",
            "relativeSource": spec.relative_source,
            "originalWidth": w,
            "originalHeight": h,
            "orientationNormalized": True,
            "album": spec.album,
            "order": spec.order,
            "caption": spec.caption,
            "alt": spec.alt,
            "roles": list(spec.roles),
            "framing": "full-frame-existing",
            "derivatives": {
                "viewer": {"src": public_src, "width": w, "height": h},
                "preview": {"src": public_src, "width": w, "height": h},
            },
            "contentHash": short_hash(source.read_bytes()),
        }

    image = heic_or_image_to_rgb(source, work)
    ow, oh = image.size
    slug = SLUGS[spec.media_id]
    digest = short_hash(source.read_bytes() + f"{ow}x{oh}".encode())
    base = f"v6-{spec.media_id.lower()}-{slug}-{digest}"

    viewer = fit_max(image, VIEWER_MAX)
    preview = fit_max(image, PREVIEW_MAX)
    viewer_path = out_dir / f"{base}.jpg"
    preview_path = out_dir / f"{base}-sm.jpg"
    save_jpeg(viewer, viewer_path)
    save_jpeg(preview, preview_path)

    return {
        "id": spec.media_id,
        "kind": "photo",
        "relativeSource": spec.relative_source,
        "originalWidth": ow,
        "originalHeight": oh,
        "orientationNormalized": True,
        "album": spec.album,
        "order": spec.order,
        "caption": spec.caption,
        "alt": spec.alt,
        "roles": list(spec.roles),
        "framing": "full-frame-native-ratio",
        "derivatives": {
            "viewer": {
                "src": f"/images/bella/{viewer_path.name}",
                "width": viewer.size[0],
                "height": viewer.size[1],
                "bytes": viewer_path.stat().st_size,
            },
            "preview": {
                "src": f"/images/bella/{preview_path.name}",
                "width": preview.size[0],
                "height": preview.size[1],
                "bytes": preview_path.stat().st_size,
            },
        },
        "contentHash": digest,
    }


def probe_video(path: Path) -> dict:
    raw = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]
    )
    data = json.loads(raw)
    video = next(s for s in data["streams"] if s.get("codec_type") == "video")
    audio_streams = [s for s in data["streams"] if s.get("codec_type") == "audio"]
    rotate = None
    tags = video.get("tags") or {}
    if "rotate" in tags:
        rotate = tags["rotate"]
    for side in video.get("side_data_list") or []:
        if "rotation" in side:
            rotate = side["rotation"]
    return {
        "duration": float(data["format"].get("duration") or video.get("duration") or 0),
        "width": int(video.get("width") or 0),
        "height": int(video.get("height") or 0),
        "codec": video.get("codec_name"),
        "rotation": rotate,
        "audioStreamCount": len(audio_streams),
        "size": int(data["format"].get("size") or path.stat().st_size),
    }


def export_video(spec: SourceSpec, source: Path, out_dir: Path, work: Path) -> dict:
    meta = probe_video(source)
    digest = short_hash(source.read_bytes()[: 1024 * 1024] + str(meta["duration"]).encode())
    slug = SLUGS[spec.media_id]
    mp4_name = f"v6-{spec.media_id.lower()}-{slug}-{digest}.mp4"
    poster_name = f"v6-{spec.media_id.lower()}-{slug}-poster-{digest}.jpg"
    mp4_path = out_dir / mp4_name
    poster_path = out_dir / poster_name

    # Silent progressive H.264; strip all audio streams. Keep full clip and AR.
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(source),
            "-map",
            "0:v:0",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-profile:v",
            "main",
            "-level",
            "4.0",
            "-crf",
            "23",
            "-movflags",
            "+faststart",
            "-vf",
            "scale='min(1920,iw)':'-2'",
            str(mp4_path),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            "0.4",
            "-i",
            str(source),
            "-frames:v",
            "1",
            "-q:v",
            "3",
            str(work / "poster-raw.jpg"),
        ]
    )
    poster = ImageOps.exif_transpose(Image.open(work / "poster-raw.jpg")).convert("RGB")
    poster = fit_max(poster, VIEWER_MAX)
    save_jpeg(poster, poster_path)

    out_meta = probe_video(mp4_path)
    if out_meta["audioStreamCount"] != 0:
        raise RuntimeError(f"Silent video still has audio streams: {mp4_path}")
    if mp4_path.stat().st_size > 25 * 1024 * 1024:
        raise RuntimeError(f"Video exceeds Cloudflare 25 MiB limit: {mp4_path.stat().st_size}")

    return {
        "id": spec.media_id,
        "kind": "video",
        "relativeSource": spec.relative_source,
        "originalWidth": meta["width"],
        "originalHeight": meta["height"],
        "orientationNormalized": True,
        "album": spec.album,
        "order": spec.order,
        "caption": spec.caption,
        "alt": spec.alt,
        "roles": list(spec.roles),
        "framing": "full-frame-native-ratio",
        "sourceMeta": meta,
        "derivatives": {
            "video": {
                "src": f"/images/bella/{mp4_path.name}",
                "width": out_meta["width"],
                "height": out_meta["height"],
                "bytes": mp4_path.stat().st_size,
                "duration": out_meta["duration"],
                "codec": out_meta["codec"],
                "audioStreamCount": out_meta["audioStreamCount"],
            },
            "poster": {
                "src": f"/images/bella/{poster_path.name}",
                "width": poster.size[0],
                "height": poster.size[1],
                "bytes": poster_path.stat().st_size,
            },
        },
        "contentHash": digest,
    }


def build_contact_sheet(entries: list[dict], dest: Path) -> None:
    cells: list[tuple[str, Image.Image]] = []
    for entry in entries:
        if entry["kind"] != "photo":
            continue
        src = entry["derivatives"]["preview"]["src"]
        path = ROOT / "public" / src.lstrip("/")
        if not path.exists():
            continue
        img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        img.thumbnail((280, 280), Image.Resampling.LANCZOS)
        label = f"{entry['id']}  {Path(entry['relativeSource']).name}"
        cells.append((label, img))

    cols = 4
    pad = 16
    cell_w, cell_h = 300, 340
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w + pad, rows * cell_h + pad), PAD)
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (label, img) in enumerate(cells):
        r, c = divmod(index, cols)
        x = pad // 2 + c * cell_w
        y = pad // 2 + r * cell_h
        ox = x + (280 - img.size[0]) // 2
        oy = y + (280 - img.size[1]) // 2
        sheet.paste(img, (ox, oy))
        draw.text((x + 4, y + 286), label[:42], fill=(40, 36, 32), font=font)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, format="JPEG", quality=85, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--contact-sheet", type=Path, default=DEFAULT_CONTACT)
    parser.add_argument("--project-root", type=Path, default=ROOT)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    entries: list[dict] = []

    with tempfile.TemporaryDirectory(prefix="bella-export-") as tmp:
        work = Path(tmp)
        for spec in SOURCES:
            source = resolve_source(spec, args.source, args.project_root)
            print(f"Exporting {spec.media_id} from {spec.relative_source}")
            if spec.kind == "video":
                entries.append(export_video(spec, source, args.out, work))
            else:
                entries.append(export_photo(spec, source, args.out, work))

    inventory = {
        "prepared": "2026-10-18",
        "sourceRootRelative": "Bella iz mladjih dana",
        "expected": {"newPhotos": 17, "existingPhotos": 6, "videos": 1},
        "actual": {
            "newPhotos": sum(1 for e in entries if e["kind"] == "photo" and "existing" not in e["roles"]),
            "existingPhotos": sum(1 for e in entries if "existing" in e["roles"]),
            "videos": sum(1 for e in entries if e["kind"] == "video"),
            "total": len(entries),
        },
        "albums": {
            "younger-days": 7,
            "little-celebrations": 4,
            "everyday": 11,
            "serbia": 2,
        },
        "items": entries,
    }
    args.inventory.parent.mkdir(parents=True, exist_ok=True)
    args.inventory.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    build_contact_sheet(entries, args.contact_sheet)
    write_typed_module(entries, args.project_root / "src" / "data" / "bellaMedia.ts")
    print(f"Wrote {args.inventory}")
    print(f"Wrote {args.contact_sheet}")
    print(f"Wrote {args.project_root / 'src' / 'data' / 'bellaMedia.ts'}")
    print(json.dumps(inventory["actual"], indent=2))


def write_typed_module(entries: list[dict], dest: Path) -> None:
    album_meta = [
        ("younger-days", "Younger days", "A few moments from Bella's puppy days."),
        ("little-celebrations", "Little celebrations", "Her first birthday and New Year's memories."),
        ("everyday", "Everyday with Bella", "Walks, naps, and time with Seb."),
        ("serbia", "A moment in Serbia", "Bella on a visit to a monastery in Serbia."),
    ]

    def photo_block(entry: dict) -> str:
        d = entry["derivatives"]
        roles = ", ".join(json.dumps(role) for role in entry["roles"])
        return f"""  {{
    id: {json.dumps(entry["id"])},
    kind: "photo",
    album: {json.dumps(entry["album"])},
    order: {entry["order"]},
    caption: {json.dumps(entry["caption"])},
    alt: {json.dumps(entry["alt"])},
    roles: [{roles}],
    preview: {{ src: {json.dumps(d["preview"]["src"])}, width: {d["preview"]["width"]}, height: {d["preview"]["height"]} }},
    viewer: {{ src: {json.dumps(d["viewer"]["src"])}, width: {d["viewer"]["width"]}, height: {d["viewer"]["height"]} }},
  }}"""

    def video_block(entry: dict) -> str:
        d = entry["derivatives"]
        roles = ", ".join(json.dumps(role) for role in entry["roles"])
        return f"""  {{
    id: {json.dumps(entry["id"])},
    kind: "video",
    album: {json.dumps(entry["album"])},
    order: {entry["order"]},
    caption: {json.dumps(entry["caption"])},
    alt: {json.dumps(entry["alt"])},
    roles: [{roles}],
    video: {{
      src: {json.dumps(d["video"]["src"])},
      width: {d["video"]["width"]},
      height: {d["video"]["height"]},
      duration: {d["video"]["duration"]},
    }},
    poster: {{ src: {json.dumps(d["poster"]["src"])}, width: {d["poster"]["width"]}, height: {d["poster"]["height"]} }},
  }}"""

    item_blocks = [
        video_block(entry) if entry["kind"] == "video" else photo_block(entry) for entry in entries
    ]
    albums_ts = "".join(
        f"""  {{
    id: {json.dumps(album_id)},
    title: {json.dumps(title)},
    intro: {json.dumps(intro)},
    items: bellaMediaItems.filter((item) => item.album === {json.dumps(album_id)}).sort((a, b) => a.order - b.order),
  }},
"""
        for album_id, title, intro in album_meta
    )
    dest.write_text(
        """/** Bella photo-story media. Generated by scripts/export-bella-media.py — do not edit by hand. */

export type BellaAlbumId = "younger-days" | "little-celebrations" | "everyday" | "serbia";

export type BellaMediaRole =
  | "album"
  | "preview"
  | "story-portrait"
  | "homepage-portrait"
  | "homepage-support"
  | "existing"
  | "legacy-portrait"
  | "video";

export interface BellaImageAsset {
  src: string;
  width: number;
  height: number;
}

export interface BellaPhotoItem {
  id: string;
  kind: "photo";
  album: BellaAlbumId;
  order: number;
  caption: string;
  alt: string;
  roles: BellaMediaRole[];
  preview: BellaImageAsset;
  viewer: BellaImageAsset;
}

export interface BellaVideoItem {
  id: string;
  kind: "video";
  album: BellaAlbumId;
  order: number;
  caption: string;
  alt: string;
  roles: BellaMediaRole[];
  video: BellaImageAsset & { duration: number };
  poster: BellaImageAsset;
}

export type BellaMediaItem = BellaPhotoItem | BellaVideoItem;

export interface BellaAlbum {
  id: BellaAlbumId;
  title: string;
  intro: string;
  items: BellaMediaItem[];
}

export const bellaMediaItems: BellaMediaItem[] = [
"""
        + ",\n".join(item_blocks)
        + """
];

export const bellaAlbums: BellaAlbum[] = [
"""
        + albums_ts
        + """];

export function getBellaAlbum(id: BellaAlbumId): BellaAlbum {
  const album = bellaAlbums.find((entry) => entry.id === id);
  if (!album) throw new Error(`Unknown Bella album: ${id}`);
  return album;
}

export function getBellaPhotos(albumId?: BellaAlbumId): BellaPhotoItem[] {
  const items = albumId ? getBellaAlbum(albumId).items : bellaMediaItems;
  return items.filter((item): item is BellaPhotoItem => item.kind === "photo");
}

export function getBellaItemById(id: string): BellaMediaItem | undefined {
  return bellaMediaItems.find((item) => item.id === id);
}

export function getBellaStoryPortrait(): BellaPhotoItem {
  const item = bellaMediaItems.find(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("story-portrait"),
  );
  if (!item) throw new Error("Bella story portrait (E05) is missing");
  return item;
}

export function getBellaHomepagePortrait(): BellaPhotoItem {
  const item = bellaMediaItems.find(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("homepage-portrait"),
  );
  if (!item) throw new Error("Bella homepage portrait is missing");
  return item;
}

export function getBellaHomepageSupports(): BellaPhotoItem[] {
  return bellaMediaItems.filter(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("homepage-support"),
  );
}

export function albumPhotoCount(album: BellaAlbum): number {
  return album.items.filter((item) => item.kind === "photo").length;
}

export function albumPreviewPhotos(album: BellaAlbum): BellaPhotoItem[] {
  return album.items.filter(
    (item): item is BellaPhotoItem => item.kind === "photo" && item.roles.includes("preview"),
  );
}
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

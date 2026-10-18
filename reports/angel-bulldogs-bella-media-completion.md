# Angel Bulldogs — Bella media completion

**Updated:** October 18, 2026 (America/Chicago)  
**Starting revision:** `08193d130f1cbb58c124b3d90ffe8a177c059d2a`  
**Release state:** Local only. Not committed, pushed, or deployed. Ready for owner review.

## 1. Starting state and changed files

Continued revision of the local Bella photo story (media already imported).

**Changed this pass**
- `src/components/BellaStory.astro` — justified aspect-ratio rows; Tumane three-column story; autoplay video wiring
- `src/components/BellaMosaicTile.astro` — `flex-grow` from photographic aspect ratio; frame hugs the image
- `src/scripts/bella-serbia-video.ts` — muted loop autoplay, pause/resume, reduced-motion, visibility
- `src/styles/global.css` — shared `--bella-gutter` (12px / 8px); justified flex rows; Serbia layout
- `src/data/bellaMedia.ts` — Tumane intro text update
- `src/lib/bellaMedia.test.ts`

**Preserved:** all selected photos; unmatted Everyday X05; `v5-portrait.jpg` for parent cards; silent MP4 with zero audio streams; noninteractive stills; no View all / counts / captions / lightbox.

## 2. Row geometry and measured gaps

Each gallery row is a flex row. Tile `flex-grow` equals `width/height` of the served preview, `flex-basis: 0`, images `width: 100%; height: auto`. That yields equal displayed heights and widths proportional to aspect ratio.

| Viewport | Expected gap | Result |
| --- | ---: | --- |
| 1363 | 12px | All multi-photo rows: height spread ≤1.5px; horizontal gaps ≈12px; wrap extension ≈0 |
| 1024 | 12px | Same |
| 768 | 12px | Same |
| 390 / 320 | 8px | Single-column stack; vertical gaps = 8px |

Raw measurements: `reports/bella-media/geometry-measurements.json`.

Younger days rows: `[Y03,Y05,Y07]` then `[Y01,Y04,Y02,Y06]`.  
Celebrations: one row of four.  
Everyday: landscape-aware pairs/triples in deliberate order.

## 3. Younger portrait outlined extension

**Cause:** CSS grid cells in the old trio stretched shorter tiles (Y01, AR 0.75) to the taller neighbors’ row height. `.bella-tile` carried cream background + border, so the empty extension was wrapper chrome, not pixels in `v6-y01-young-portrait-*`.

**Repair:** justified flex rows so tile height equals image height; tile background/border removed; radius applied on the image itself. Measured `wrapExtra` for Y01 row = 0.

Everyday X05 remains `v6-x05-portrait-unmatted*`. Parent cards still use `v5-portrait.jpg`.

## 4. Tumane story

Desktop columns: **video · photo · text** (text ~30–35% width).  
Phone order: **video → photo → text**.

Subheading **Tumane Monastery**, then the approved paragraphs (tradition / 1572–1573 record / Saint Zosimus hermitage). Old 1924-focused blurb removed.

Sources (implementation reference, Oct 18, 2026):  
https://togolubac.rs/ · https://manastirtumane.org/istorijat · https://togolubac.rs/en/tumane-monastery/

Typography: serif title; body ~20px desktop (1.25rem), ~18px phone (1.125rem), line-height ~1.55.

## 5. Silent autoplay video

- Derivative: `v6-s02-monastery-silent-cc8b1816.mp4` — **0 audio streams** (`ffprobe`)
- `muted` + `loop` + `playsinline`; no `controls`; `pointer-events: none` on media
- Script starts playback when section is near viewport (unless reduced motion / user paused)
- Pauses when offscreen or tab hidden; does not resume after explicit Pause
- Discreet **Pause motion / Resume motion** control in the story column
- Chrome headless check: after scroll-in, `paused: false`, `currentTime` advancing, `controls: false`

Real iPhone/Safari not tested.

## 6. Tests / build / coverage

```text
npm test   → 156 pass / 0 fail
npm run build → 0 check errors; 15 pages built
```

Viewports: **320, 390, 768, 1024, 1363**. Zero live form submissions.

## 7. Screenshots

| File | Shows |
| --- | --- |
| `reports/bella-media/30-serbia-triple-1363.png` | Video · photo · Tumane text |
| `reports/bella-media/31-younger-justified-1363.png` | Justified younger rows |
| `reports/bella-media/32-celebrations-justified-1363.png` | Four celebration photos, even heights |
| `reports/bella-media/33-everyday-row-gaps-1363.png` | Everyday landscape/portrait rows without holes |

## 8. Preview

[http://127.0.0.1:4321/bella](http://127.0.0.1:4321/bella)

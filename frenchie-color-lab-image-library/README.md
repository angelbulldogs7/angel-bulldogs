# Frenchie Color Lab image library

Working area for Color Lab visuals. Nothing in this folder is served or bundled; the site
only shows files that are copied into `public/` **and** registered as approved.

```text
manifest/
  visual-manifest.v2.json   Generated. Every deduplicated visible recipe and its layers.
  SUMMARY.md                Generated. Counts, axes, and the layer checklist.
archive/
  excluded-color-lab-assets-v1/   Retired v1 material. Do not restore.
```

Regenerate the manifest after any change to the resolver, locus catalog, or registry:

```sh
npm run color-lab:manifest
```

`npm test` fails if the committed manifest is out of date.

## How visuals are chosen

1. DNA resolves to a structured phenotype (`src/lib/color-lab/phenotypeResolver.ts`).
2. The phenotype carries a typed visual recipe: base (standard, fluffy, or hairless), coat,
   visible pigment, mask, brindle, merle, pied, automatic eyes, and Big Rope.
3. The recipe's visible signature is the cache key. Hidden carriers, names, sex, and
   Lab-confirmed status never change it, so all carriers of one look share one visual.
4. `src/lib/color-lab/visualCache.ts` resolves the recipe through the explicit registry in
   `src/data/color-lab/visualRegistry.ts`:
   - an approved pre-composited derivative for the recipe's slug, or
   - every required layer approved, stacked bottom to top, or
   - otherwise the branded "Image coming soon" placeholder. There is never a nearest-color
     or nearest-pattern substitute.
5. Double Merle (M/M) outcomes always use a warning panel, never a puppy image. FOXI3
   Dup/Dup never gets a card or image.

## Anchors

| Base | Role | Expected master |
| --- | --- | --- |
| standard | Approved permanent identity — corrected no-white Solid master | `classic-fawn-solid-master-v2.png` |
| fluffy | Approved natural Fluffy anchor | — |
| hairless | Corrected viable Hairless anchor | — |

Solid recipes must never add white markings (no chest stripe or white toes). The only
white-spotting layer is the single representative Pied map, used only when Pied is visible.

None of these files are in the repository yet, so every recipe currently renders the
placeholder.

## Adding an approved layer or derivative

1. Export a 4:5 WebP (800×1000 or larger at the same ratio) aligned to its anchor. Layers are
   transparent except the anchor.
2. Save it at the expected path listed in `manifest/SUMMARY.md`, for example
   `public/images/color-lab/layers/coat/standard/fawn.webp`.
3. Register it in `APPROVED_LAYERS` (or, for a full composite keyed by recipe slug,
   `APPROVED_DERIVATIVES`) in `src/data/color-lab/visualRegistry.ts`.
4. Run `npm run color-lab:manifest`, `npm test`, and `npm run build`.

Every image is shown with the disclosure: "AI-generated representative visualization. Real
shade, marking placement, coat texture, eyes, and markings vary."

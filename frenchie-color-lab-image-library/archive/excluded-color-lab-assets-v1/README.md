# Excluded Color Lab material — v1 (inactive)

Everything in this folder is retired. It is excluded from TypeScript (`tsconfig.json`), never
imported by the site, and kept only as history. **Do not restore any of it.** The active
source of truth is the simplified v2 Color Lab in `src/data/color-lab`, `src/lib/color-lab`,
`src/components/color-lab`, and `src/scripts/color-lab`.

## Why v1 was retired

The v2 simplification (ruleset 2.0.0, saved-dog schema 2) replaced v1 because:

- v1 used a Guided / Advanced copy-density switch. v2 has one simple interface.
- v1 asked for two independent allele pickers per gene. v2 uses one complete genotype-pair
  selection per gene, and carrier status is derived from that selection.
- v1 included Curl (KRT71) and Furnishings (RSPO2). Both were removed from the active model.
- v1 exposed lab sub-variants (d1–d3; bs, bd, bc; L1–L5). v2 groups them as d, b, and l.
- v1 modeled black saddle and a "Red intensity" I/i locus with v1 naming (Lilac = brown +
  dilute, "New Shade"). v2 uses the approved eight-name pigment map, Aᴮᴮ And Tan, and N/In
  Intensity Dilution.
- v1 assumed one static photograph per phenotype slug. v2 uses a layered renderer keyed by
  visible signature.
- v1 treated any N/S Pied as pied and allowed a Dup/Dup "dog" to be saved. v2 treats S/S as
  Pied and Dup/Dup as nonviable at conception only.

Saved dogs from v1 (`angel-bulldogs.color-lab.v1`) migrate automatically; see
`src/lib/color-lab/migrations.ts`. v1 never stored a laboratory attestation (its per-locus
"confirmed" flag meant "user-entered"), so every v1 dog migrates as Assumed.

## Inventory

| Item | Status |
| --- | --- |
| `v1-source-snapshot/src/**` | Frozen copy of the v1 Color Lab source. It was never committed to git, so this is its only copy. |
| `v1-source-snapshot/public/images/color-lab/README.md` | Superseded v1 image guide (one image per phenotype slug). Moved out of `public/` so it is no longer served. |
| `v1-source-snapshot/public/images/color-lab/phenotypes/.gitkeep` | Retired per-phenotype image folder. |

Searched for on 2026-09-23 and **not present** in this repository (nothing to archive):

- Curl or Furnishings image assets
- Removed shade, Brindle-density, or eye-choice assets
- The old 922,804-entry JSON/CSV manifest, its count summary, and its generator
- Any puppy image files, including the approved `classic-fawn-solid-master-v2.png` master

The earlier planning prompts (`angel-bulldogs-frenchie-color-lab-cursor-prompt.md` and the
production materials it referenced) live outside this repository. They are superseded by the
v2 simplification wherever they conflict with it.

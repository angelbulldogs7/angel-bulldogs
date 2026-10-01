# Color Lab phenotype images

Photorealistic studio puppy photographs are **not generated in this repository**. The Color Lab resolves a stable `imageId` (phenotype slug) and looks it up in `src/data/color-lab/imageRegistry.ts`. Missing files use `public/images/color-lab/coming-soon.svg` at the same 4:5 frame.

## File location and name

Place each image at:

```text
public/images/color-lab/phenotypes/<imageId>.webp
```

`imageId` is the visible phenotype slug from the resolver (for example `fawn`, `black-merle`, `lilac-pied-fluffy`). Do not derive paths from visitor input.

After adding a file, add its `imageId` to `AVAILABLE_PHENOTYPE_ASSETS` in `imageRegistry.ts`.

## Frame and capture notes

- Aspect ratio: **4:5** portrait (`800×1000` source, or larger at the same ratio).
- Puppy age: consistent weanling / young-puppy stage across the set.
- Pose: front or slight three-quarter, comparable camera distance.
- Lighting: even studio light.
- Background: ivory / porcelain, matching the site (`#fffdf8` / `#faf6ee`).
- Format: WebP, plus a JPEG fallback later if needed. Aim under ~180 KB per image.
- Alt text is generated as: `Representative {commonName} French Bulldog puppy. Studio image, not a prediction of an individual dog.`

Do not claim an image predicts markings, white coverage, merle layout, eyes, nose, or coat texture of a specific puppy.

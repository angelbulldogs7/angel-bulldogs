import type { MediaAsset } from "./types";

/**
 * Current public litter context for the Available Puppies page.
 * Keep nav labeled "Available Puppies"; this block carries parent/litter story.
 */
export const currentLitter = {
  id: "litter-1",
  label: "Bella’s first litter",
  /** Short page framing — parents matter more than a litter number in the menu. */
  lede: "These puppies are from Bella’s first litter, raised in our Chicago home. Dam and sire details appear on each puppy card.",
  hero: {
    src: "/images/puppies/litter-1/hero.jpg",
    alt: "Bella’s first litter resting together in their whelping box",
    width: 1600,
    height: 1200,
    kind: "image",
  } satisfies MediaAsset,
  gallery: [
    {
      src: "/images/puppies/litter-1/gallery-01.jpg",
      alt: "Two puppies from Bella’s first litter resting together",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/gallery-02.jpg",
      alt: "Puppies from Bella’s first litter on their paw-print blanket",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/gallery-03.jpg",
      alt: "Close view of puppies from Bella’s first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
  ] as const satisfies readonly MediaAsset[],
} as const;

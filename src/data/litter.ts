import type { MediaAsset } from "./types";

/**
 * Current public litter context. Shared birth date is the single source of truth
 * for age display across listing and detail pages.
 */
export const currentLitter = {
  id: "litter-1",
  label: "Bella's first litter",
  /** ISO date, America/Chicago calendar age. */
  birthDate: "2026-08-05",
  ageTimeZone: "America/Chicago",
  lede: "Dam and sire details appear with each puppy. Meet Bella for the fuller family story.",
  hero: {
    src: "/images/puppies/litter-1/v5-hero.jpg",
    alt: "Bella's first litter resting together on their bed",
    width: 1600,
    height: 1200,
    kind: "image",
  } satisfies MediaAsset,
  gallery: [
    {
      src: "/images/puppies/litter-1/v5-s-01.jpg",
      alt: "Bella touching noses with a puppy from her first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-s-02.jpg",
      alt: "Bella resting close with a puppy from her first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-01.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-02.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-03.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-04.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-05.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
    {
      src: "/images/puppies/litter-1/v5-o-06.jpg",
      alt: "Earlier photo from Bella's first litter",
      width: 1200,
      height: 900,
      kind: "image",
    },
  ] as const satisfies readonly MediaAsset[],
} as const;

export function getLitterBirthDate(): string {
  return currentLitter.birthDate;
}

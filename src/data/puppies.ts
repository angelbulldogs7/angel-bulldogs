import type { Puppy } from "./types";

/**
 * Bella’s first litter. Photos are live; birth dates should still be confirmed.
 *
 * Sex is filled from typical naming for these records — confirm before launch.
 * Color and coat labels below are the owner-provided colorways for this litter.
 */
export const puppies: Puppy[] = [
  {
    id: "aspy",
    slug: "aspy",
    name: "Aspy",
    status: "available",
    sex: "female",
    dateOfBirth: null,
    color: "New Shade Rojo Merle Fluffy",
    coatType: "Carrying Intensity",
    shortDescription: "A soft merle coat, bright blue eyes, and a calm way of watching the room.",
    longDescription:
      "Aspy is from Bella’s first litter. Her New Shade Rojo merle fluff and blue eyes stand out in photos; a future family will learn her everyday personality in person.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/aspy/primary.jpg",
      alt: "Aspy, a New Shade Rojo Merle Fluffy French Bulldog puppy, looking toward the camera",
      width: 800,
      height: 1000,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/aspy/gallery-01.jpg",
        alt: "Aspy sitting in profile on a paw-print blanket",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/gallery-02.jpg",
        alt: "Another view of Aspy’s merle coat and blue eyes",
        width: 800,
        height: 1000,
        kind: "image",
      },
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  },
  {
    id: "chloe",
    slug: "chloe",
    name: "Chloe",
    status: "available",
    sex: "female",
    dateOfBirth: null,
    color: "New Shade Isabella Pied",
    coatType: "Carrying Fluffy · Carrying Intensity",
    shortDescription: "A light New Shade Isabella pied coat and an alert, upward gaze that follows everything nearby.",
    longDescription:
      "Chloe is from Bella’s first litter. Her New Shade Isabella pied coat and blue-grey eyes give her a soft look; meet her in person to see how she settles into play and rest.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/chloe/primary.jpg",
      alt: "Chloe, a New Shade Isabella Pied French Bulldog puppy, sitting and looking upward",
      width: 800,
      height: 1000,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/chloe/gallery-01.jpg",
        alt: "Chloe sitting with her back toward the camera",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/gallery-02.jpg",
        alt: "Chloe standing in profile on her blanket",
        width: 800,
        height: 1000,
        kind: "image",
      },
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  },
  {
    id: "coco",
    slug: "coco",
    name: "Coco",
    status: "available",
    sex: "female",
    dateOfBirth: null,
    color: "New Shade Rojo Merle",
    coatType: "Carrying Fluffy · Carrying Intensity",
    shortDescription: "A bold New Shade Rojo merle pattern with a steady, side-on presence.",
    longDescription:
      "Coco is from Bella’s first litter. Her New Shade Rojo merle markings read clearly in every photo; placement still begins with a personal conversation about your home.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/coco/primary.jpg",
      alt: "Coco, a New Shade Rojo Merle French Bulldog puppy, sitting in profile",
      width: 800,
      height: 1000,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/coco/gallery-01.jpg",
        alt: "Coco’s merle coat in a full side view",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/gallery-02.jpg",
        alt: "Another portrait of Coco on the paw-print blanket",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/gallery-03.jpg",
        alt: "Coco looking across the pen",
        width: 800,
        height: 1000,
        kind: "image",
      },
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  },
  {
    id: "hamilton",
    slug: "hamilton",
    name: "Hamilton",
    status: "available",
    sex: "male",
    dateOfBirth: null,
    color: "New Shade Rojo Merle",
    coatType: "Carrying Intensity",
    shortDescription: "Merle markings, light blue eyes, and a curious lean toward the camera.",
    longDescription:
      "Hamilton is from Bella’s first litter. His New Shade Rojo merle coat and blue eyes are easy to spot; we are happy to talk through temperament and timing once you inquire.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/hamilton/primary.jpg",
      alt: "Hamilton, a New Shade Rojo Merle French Bulldog puppy with blue eyes",
      width: 800,
      height: 1000,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/hamilton/gallery-01.jpg",
        alt: "Hamilton standing in three-quarter view",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/gallery-02.jpg",
        alt: "Hamilton on the litter blanket",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/gallery-03.jpg",
        alt: "Another photo of Hamilton from Bella’s litter",
        width: 800,
        height: 1000,
        kind: "image",
      },
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  },
  {
    id: "romeo",
    slug: "romeo",
    name: "Romeo",
    status: "available",
    sex: "male",
    dateOfBirth: null,
    color: "New Shade Isabella Pied Fluffy",
    coatType: "Carrying Intensity",
    shortDescription: "New Shade Isabella pied fluff, a white blaze, and soft coat around the ears.",
    longDescription:
      "Romeo is from Bella’s first litter. His New Shade Isabella pied fluffy coat and facial blaze photograph warmly; reach out when you are ready to talk about matching a puppy to your home.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/romeo/primary.jpg",
      alt: "Romeo, a New Shade Isabella Pied Fluffy French Bulldog puppy with a white blaze, looking at the camera",
      width: 800,
      height: 1000,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/romeo/gallery-01.jpg",
        alt: "Romeo standing in three-quarter profile",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/gallery-02.jpg",
        alt: "Romeo on the paw-print blanket",
        width: 800,
        height: 1000,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/gallery-03.jpg",
        alt: "Another portrait of Romeo from Bella’s litter",
        width: 800,
        height: 1000,
        kind: "image",
      },
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  },
];

export function getAvailablePuppies(): Puppy[] {
  return puppies.filter((puppy) => puppy.available && puppy.status === "available");
}

export function getFeaturedAvailablePuppies(limit = 3): Puppy[] {
  const available = getAvailablePuppies();
  const featured = available.filter((puppy) => puppy.featured);
  const source = featured.length > 0 ? featured : available;
  return source.slice(0, limit);
}

export function getPuppyBySlug(slug: string): Puppy | undefined {
  return puppies.find((puppy) => puppy.slug === slug);
}

export function getAvailablePuppyOptions(): { slug: string; name: string }[] {
  return getAvailablePuppies().map((puppy) => ({
    slug: puppy.slug,
    name: puppy.name,
  }));
}

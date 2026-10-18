import type { Puppy } from "./types";

/**
 * Bella's first litter. Shared birth date lives on currentLitter (2026-08-05).
 *
 * Gallery order:
 * 1. Final Stenci photos first (Blue-tagged preferred primary, then the rest)
 * 2. Older original-site photos last (v5-o-XX)
 *
 * Filenames are versioned (v5-*) so browsers/CDNs cannot keep serving old crops.
 * Exports fit the full photo into a cream 4:3 canvas.
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
    coatType: "Fluffy coat",
    estimatedCarrierTraits: ["Intensity"],
    shortDescription: "Affectionate and sociable, with a love of cuddles and company.",
    longDescription:
      "Aspy is affectionate and sociable, with a particular love of attention from her people. She enjoys cuddles, exploring new things, and playing with her siblings, Bella, and Seb.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/aspy/v5-primary.jpg",
      alt: "Aspy, a New Shade Rojo Merle Fluffy French Bulldog puppy, looking toward the camera",
      width: 1200,
      height: 900,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/aspy/v5-s-01.jpg",
        alt: "Aspy, photo 2",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-02.jpg",
        alt: "Aspy, photo 3",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-03.jpg",
        alt: "Aspy, photo 4",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-04.jpg",
        alt: "Aspy, photo 5",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-05.jpg",
        alt: "Aspy, photo 6",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-06.jpg",
        alt: "Aspy, photo 7",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-07.jpg",
        alt: "Aspy, photo 8",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-08.jpg",
        alt: "Aspy, photo 9",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-09.jpg",
        alt: "Aspy, photo 10",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-10.jpg",
        alt: "Aspy, photo 11",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-11.jpg",
        alt: "Aspy, photo 12",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-12.jpg",
        alt: "Aspy, photo 13",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-13.jpg",
        alt: "Aspy, photo 14",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-s-14.jpg",
        alt: "Aspy, photo 15",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-o-01.jpg",
        alt: "Aspy, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-o-02.jpg",
        alt: "Aspy, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/aspy/v5-o-03.jpg",
        alt: "Aspy, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      }
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
    coatType: "Smooth coat",
    estimatedCarrierTraits: ["Fluffy", "Intensity"],
    shortDescription: "Curious and self-assured, always interested in something new.",
    longDescription:
      "Chloe is curious and self-assured, with a strong personality and a lively interest in anything new. She loves exploring and often brings a confident presence to play with the rest of the litter.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/chloe/v5-primary.jpg",
      alt: "Chloe, a New Shade Isabella Pied French Bulldog puppy, sitting and looking to the side",
      width: 1200,
      height: 900,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/chloe/v5-s-01.jpg",
        alt: "Chloe, photo 2",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-02.jpg",
        alt: "Chloe, photo 3",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-03.jpg",
        alt: "Chloe, photo 4",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-04.jpg",
        alt: "Chloe, photo 5",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-05.jpg",
        alt: "Chloe, photo 6",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-06.jpg",
        alt: "Chloe, photo 7",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-s-07.jpg",
        alt: "Chloe, photo 8",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-o-01.jpg",
        alt: "Chloe, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-o-02.jpg",
        alt: "Chloe, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/chloe/v5-o-03.jpg",
        alt: "Chloe, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      }
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
    coatType: "Smooth coat",
    estimatedCarrierTraits: ["Fluffy", "Intensity"],
    shortDescription: "Cuddly and calm, with a playful side.",
    longDescription:
      "Coco is cuddly and calm, with a playful side that comes out between her quieter moments. She enjoys affection and moves between lively play and relaxed time with her people.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/coco/v5-primary.jpg",
      alt: "Coco, a New Shade Rojo Merle French Bulldog puppy, shown in profile facing to the side",
      width: 1200,
      height: 900,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/coco/v5-s-01.jpg",
        alt: "Coco, photo 2",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-02.jpg",
        alt: "Coco, photo 3",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-03.jpg",
        alt: "Coco, photo 4",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-04.jpg",
        alt: "Coco, photo 5",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-05.jpg",
        alt: "Coco, photo 6",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-06.jpg",
        alt: "Coco, photo 7",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-07.jpg",
        alt: "Coco, photo 8",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-08.jpg",
        alt: "Coco, photo 9",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-09.jpg",
        alt: "Coco, photo 10",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-10.jpg",
        alt: "Coco, photo 11",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-s-11.jpg",
        alt: "Coco, photo 12",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-o-01.jpg",
        alt: "Coco, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-o-02.jpg",
        alt: "Coco, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-o-03.jpg",
        alt: "Coco, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/coco/v5-o-04.jpg",
        alt: "Coco, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      }
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
    coatType: "Smooth coat",
    estimatedCarrierTraits: ["Intensity"],
    shortDescription: "Quick, curious, and full of goofy little movements.",
    longDescription:
      "Hamilton is the little comedian of the litter: quick, curious, and full of playful movement. He loves sniffing out something new, bouncing into play, and exploring the house.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/hamilton/v5-primary.jpg",
      alt: "Hamilton, a New Shade Rojo Merle French Bulldog puppy with blue eyes",
      width: 1200,
      height: 900,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/hamilton/v5-s-01.jpg",
        alt: "Hamilton, photo 2",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-02.jpg",
        alt: "Hamilton, photo 3",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-03.jpg",
        alt: "Hamilton, photo 4",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-04.jpg",
        alt: "Hamilton, photo 5",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-05.jpg",
        alt: "Hamilton, photo 6",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-06.jpg",
        alt: "Hamilton, photo 7",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-07.jpg",
        alt: "Hamilton, photo 8",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-s-08.jpg",
        alt: "Hamilton, photo 9",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-o-01.jpg",
        alt: "Hamilton, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-o-02.jpg",
        alt: "Hamilton, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-o-03.jpg",
        alt: "Hamilton, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/hamilton/v5-o-04.jpg",
        alt: "Hamilton, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      }
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
    coatType: "Fluffy coat",
    estimatedCarrierTraits: ["Intensity"],
    shortDescription: "Clever and confident, with a big-brother presence.",
    longDescription:
      "Romeo is a clever, confident boy with a sturdy presence among his siblings. He often has a big-brother air about him, taking the lead as the litter explores and plays together.",
    damId: "bella",
    sireId: "sire",
    primaryImage: {
      src: "/images/puppies/romeo/v5-primary.jpg",
      alt: "Romeo, a New Shade Isabella Pied Fluffy French Bulldog puppy with a white blaze, looking at the camera",
      width: 1200,
      height: 900,
      kind: "image",
    },
    gallery: [
      {
        src: "/images/puppies/romeo/v5-s-01.jpg",
        alt: "Romeo, photo 2",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-02.jpg",
        alt: "Romeo, photo 3",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-03.jpg",
        alt: "Romeo, photo 4",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-04.jpg",
        alt: "Romeo, photo 5",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-05.jpg",
        alt: "Romeo, photo 6",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-06.jpg",
        alt: "Romeo, photo 7",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-07.jpg",
        alt: "Romeo, photo 8",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-08.jpg",
        alt: "Romeo, photo 9",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-09.jpg",
        alt: "Romeo, photo 10",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-10.jpg",
        alt: "Romeo, photo 11",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-11.jpg",
        alt: "Romeo, photo 12",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-12.jpg",
        alt: "Romeo, photo 13",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-s-13.jpg",
        alt: "Romeo, photo 14",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-o-01.jpg",
        alt: "Romeo, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-o-02.jpg",
        alt: "Romeo, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-o-03.jpg",
        alt: "Romeo, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      },
      {
        src: "/images/puppies/romeo/v5-o-04.jpg",
        alt: "Romeo, earlier photo",
        width: 1200,
        height: 900,
        kind: "image",
      }
    ],
    video: null,
    featured: true,
    available: true,
    placeholder: false,
  }
];

export function getAllPuppies(): Puppy[] {
  return puppies.filter((puppy) => !puppy.placeholder);
}

export function getAvailablePuppies(): Puppy[] {
  return getAllPuppies().filter((puppy) => puppy.status === "available" && puppy.available);
}

export function getListedPuppies(): Puppy[] {
  return getAllPuppies();
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

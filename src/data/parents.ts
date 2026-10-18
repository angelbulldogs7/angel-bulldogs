import type { Parent } from "./types";
import { BELLA_LITTER_LIMIT_COPY, NATURAL_DELIVERY_COPY } from "./content";

export const parents: Parent[] = [
  {
    id: "bella",
    name: "Bella",
    role: "dam",
    origin: "Serbia",
    dateOfBirth: "2024-12-23",
    coat: "New Shade Isabella Merle Fluffy",
    portrait: {
      src: "/images/bella/v5-portrait.jpg",
      alt: "Bella, a New Shade Isabella Merle Fluffy French Bulldog, looking up at the camera",
      width: 800,
      height: 1000,
      kind: "image",
    },
    intro:
      "Bella is the heart of Angel Bulldogs. She came from Serbia and now lives as part of our family in Chicago.",
    highlights: [
      "Raised and living as part of the family in Chicago",
      NATURAL_DELIVERY_COPY,
      "Bella herself naturally delivered her litter",
      BELLA_LITTER_LIMIT_COPY,
    ],
    registration: null,
    healthTesting: null,
    weight: null,
    dnaPanel: null,
    pedigree: null,
    titles: null,
  },
  {
    id: "sire",
    name: "Kiki",
    role: "sire",
    origin: null,
    // TODO: Add Kiki’s verified date of birth (ISO YYYY-MM-DD) when confirmed for publication.
    dateOfBirth: null,
    // TODO: Add Kiki’s verified coat description when confirmed for publication.
    coat: null,
    portrait: null,
    intro:
      "Kiki is the sire of Bella’s puppies. Additional details will be shared during a personal inquiry when they are useful for placement.",
    highlights: [],
    registration: null,
    healthTesting: null,
    weight: null,
    dnaPanel: null,
    pedigree: null,
    titles: null,
  },
];

export function getParentById(id: string): Parent | undefined {
  return parents.find((parent) => parent.id === id);
}

export function getDam(): Parent {
  const bella = getParentById("bella");
  if (!bella) {
    throw new Error("Bella parent record is missing from src/data/parents.ts");
  }
  return bella;
}

export function getSire(): Parent {
  const sire = getParentById("sire");
  if (!sire) {
    throw new Error("Sire parent record is missing from src/data/parents.ts");
  }
  return sire;
}

export function displayParentName(parent: Parent): string {
  if (parent.name.trim()) return parent.name;
  return parent.role === "sire" ? "The Sire" : "Dam";
}

import type { Parent } from "./types";

export const parents: Parent[] = [
  {
    id: "bella",
    name: "Bella",
    role: "dam",
    origin: "Serbia",
    dateOfBirth: "2024-12-23",
    coat: "New Shade Isabella Merle Fluffy",
    portrait: {
      src: "/placeholders/bella-portrait.svg",
      alt: "Placeholder for a portrait of Bella, 4:5",
      width: 800,
      height: 1000,
      kind: "image",
    },
    intro:
      "Bella is the heart of Angel Bulldogs. She came from Serbia and now lives as part of our family in Chicago.",
    highlights: [
      "Raised and living as part of the family in Chicago",
      "Natural-whelping family history: Bella, her mother, maternal grandmother, and maternal aunt",
      "Bella herself naturally delivered her litter",
      "A maximum of three litters in her lifetime",
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
    name: "",
    role: "sire",
    // TODO: Add the sire’s verified name.
    origin: null,
    // TODO: Add the sire’s verified date of birth (ISO YYYY-MM-DD).
    dateOfBirth: null,
    // TODO: Add the sire’s verified coat description.
    coat: null,
    portrait: {
      src: "/placeholders/stud-portrait.svg",
      alt: "Placeholder for a portrait of the sire, 4:5",
      width: 800,
      height: 1000,
      kind: "image",
    },
    intro: null,
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

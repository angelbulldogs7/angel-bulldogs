import type {
  AlleleDefinition,
  GenotypeOption,
  GenotypeStatus,
  LocusDefinition,
  LocusId,
  SectionId,
} from "../../lib/color-lab/types";
import { LOCUS_IDS } from "../../lib/color-lab/types";

function allele(id: string, symbol: string = id): AlleleDefinition {
  return { id, symbol };
}

function pair(
  a: string,
  b: string,
  label: string,
  status: GenotypeStatus,
  selectable = true,
): GenotypeOption {
  return { id: `${a}/${b}`, alleles: [a, b], label, status, selectable };
}

/** Clear / carrier / expressed rows for a simple recessive locus. */
function recessive(
  dominant: string,
  variant: string,
  labels: { clear: string; carrier: string; expressed: string },
): GenotypeOption[] {
  return [
    pair(dominant, dominant, labels.clear, "clear"),
    pair(dominant, variant, labels.carrier, "carrier"),
    pair(variant, variant, labels.expressed, "expressed"),
  ];
}

const CATALOG: Readonly<Record<LocusId, LocusDefinition>> = {
  asip: {
    id: "asip",
    section: "color",
    name: "Agouti",
    locusLabel: "ASIP",
    geneSymbol: "ASIP",
    help: "Agouti only shows where the K row allows it; And Tan groups the tan-point patterns older reports call aᵗ.",
    alleles: [allele("ady", "Aᴰʸ"), allele("asy", "Aˢʸ"), allele("abb", "Aᴮᴮ"), allele("a")],
    options: [
      pair("ady", "ady", "Fawn", "expressed"),
      pair("ady", "asy", "Fawn, carries Sable", "carrier"),
      pair("ady", "abb", "Fawn, carries And Tan", "carrier"),
      pair("ady", "a", "Fawn, carries Recessive Black", "carrier"),
      pair("asy", "asy", "Sable", "expressed"),
      pair("asy", "abb", "Sable, carries And Tan", "carrier"),
      pair("asy", "a", "Sable, carries Recessive Black", "carrier"),
      pair("abb", "abb", "And Tan", "expressed"),
      pair("abb", "a", "And Tan, carries Recessive Black", "carrier"),
      pair("a", "a", "Recessive Black", "expressed"),
    ],
    baseline: "ady/ady",
  },
  dilute: {
    id: "dilute",
    section: "color",
    name: "Dilute",
    locusLabel: "MLPH",
    geneSymbol: "MLPH",
    help: "Any dilute variant listed on a lab report counts as d here.",
    alleles: [allele("D"), allele("d")],
    options: recessive("D", "d", { clear: "Clear", carrier: "Carries Dilute", expressed: "Dilute" }),
    baseline: "D/D",
  },
  cocoa: {
    id: "cocoa",
    section: "color",
    name: "Cocoa",
    locusLabel: "HPS3",
    geneSymbol: "HPS3",
    help: "Cocoa (HPS3) is a different gene from Brown (TYRP1).",
    alleles: [allele("Co"), allele("co")],
    options: recessive("Co", "co", { clear: "Clear", carrier: "Carries Cocoa", expressed: "Cocoa" }),
    baseline: "Co/Co",
  },
  tyrp1: {
    id: "tyrp1",
    section: "color",
    name: "Brown",
    locusLabel: "TYRP1",
    geneSymbol: "TYRP1",
    help: "Any brown variant listed on a lab report counts as b here.",
    alleles: [allele("B"), allele("b")],
    options: recessive("B", "b", { clear: "Clear", carrier: "Carries Brown", expressed: "Brown" }),
    baseline: "B/B",
  },
  k: {
    id: "k",
    section: "patterns",
    name: "Dominant Black & Brindle",
    locusLabel: "K locus",
    geneSymbol: "CBD103",
    help: "Dominant Black (Kᴮ) covers Agouti and Brindle, so Brindle needs kᵇʳ without Kᴮ.",
    alleles: [allele("KB", "Kᴮ"), allele("kbr", "kᵇʳ"), allele("ky", "kʸ")],
    options: [
      pair("KB", "KB", "Dominant Black", "expressed"),
      pair("KB", "kbr", "Dominant Black, carries Brindle", "carrier"),
      pair("KB", "ky", "Dominant Black, carries Agouti expression", "carrier"),
      pair("kbr", "kbr", "Brindle", "expressed"),
      pair("kbr", "ky", "Brindle, carries Agouti expression", "carrier"),
      pair("ky", "ky", "Allows Agouti", "clear"),
    ],
    baseline: "ky/ky",
  },
  mc1r: {
    id: "mc1r",
    section: "patterns",
    name: "Mask, Extension, Husky & Cream",
    locusLabel: "E locus",
    geneSymbol: "MC1R",
    help: "Eᴹ adds a mask, e/e makes a cream coat that hides most patterns, and eᴬ shows Husky only with kʸ/kʸ and And Tan.",
    alleles: [allele("Em", "Eᴹ"), allele("E"), allele("eA", "eᴬ"), allele("e")],
    options: [
      pair("Em", "Em", "Masked extension", "expressed"),
      pair("Em", "E", "Masked extension", "expressed"),
      pair("Em", "eA", "Masked extension, carries Husky", "carrier"),
      pair("Em", "e", "Masked extension, carries Cream", "carrier"),
      pair("E", "E", "Normal extension", "clear"),
      pair("E", "eA", "Normal extension, carries Husky", "carrier"),
      pair("E", "e", "Normal extension, carries Cream", "carrier"),
      pair("eA", "eA", "Husky-capable", "expressed"),
      pair("eA", "e", "Husky-capable, carries Cream", "carrier"),
      pair("e", "e", "Cream / recessive red", "expressed"),
    ],
    baseline: "Em/E",
  },
  mitf: {
    id: "mitf",
    section: "patterns",
    name: "Pied",
    locusLabel: "S locus",
    geneSymbol: "MITF",
    help: "Exact white coverage and patch placement are not predicted.",
    alleles: [allele("N"), allele("S")],
    options: recessive("N", "S", { clear: "Not Pied", carrier: "Carries Pied", expressed: "Pied" }),
    baseline: "N/N",
  },
  merle: {
    id: "merle",
    section: "patterns",
    name: "Merle",
    locusLabel: "M locus",
    geneSymbol: "PMEL",
    help: "Simplified model with no cryptic, atypical, mosaic, or harlequin merle, and M/M is a health concern.",
    alleles: [allele("M"), allele("m")],
    options: [
      pair("m", "m", "Not Merle", "clear"),
      pair("M", "m", "Merle", "expressed"),
      pair("M", "M", "Double Merle", "concerning"),
    ],
    baseline: "m/m",
  },
  fgf5: {
    id: "fgf5",
    section: "coat",
    name: "Fluffy",
    locusLabel: "FGF5",
    geneSymbol: "FGF5",
    help: "Some labs write the long-coat variant as L, but here Standard Coat is L and Fluffy is l.",
    alleles: [allele("L"), allele("l")],
    options: recessive("L", "l", {
      clear: "Standard Coat",
      carrier: "Carries Fluffy",
      expressed: "Fluffy",
    }),
    baseline: "L/L",
  },
  intensity: {
    id: "intensity",
    section: "coat",
    name: "Intensity Dilution",
    locusLabel: null,
    geneSymbol: "MFSD12",
    help: "Lightens fawn or red pigment toward cream or white, but never black or brown.",
    alleles: [allele("N"), allele("In")],
    options: recessive("N", "In", {
      clear: "Clear",
      carrier: "Carries Intensity Dilution",
      expressed: "Intensity Dilution",
    }),
    baseline: "N/N",
  },
  slc45a2: {
    id: "slc45a2",
    section: "coat",
    name: "Pink",
    locusLabel: "SLC45A2",
    geneSymbol: "SLC45A2",
    help: "Pink is SLC45A2 albinism (some labs report LAA or caL) and hides the dog's other colors and patterns.",
    alleles: [allele("N"), allele("alb")],
    options: recessive("N", "alb", { clear: "Not Pink", carrier: "Carries Pink", expressed: "Pink" }),
    baseline: "N/N",
  },
  foxi3: {
    id: "foxi3",
    section: "coat",
    name: "Hairless",
    locusLabel: "FOXI3",
    geneSymbol: "FOXI3",
    help: "N/Dup is hairless and linked to missing or misshapen teeth; Dup/Dup is not viable, so it cannot be selected.",
    alleles: [allele("N"), allele("Dup")],
    options: [
      pair("N", "N", "Coated", "clear"),
      pair("N", "Dup", "Hairless", "expressed"),
      pair("Dup", "Dup", "Nonviable at conception", "nonviable", false),
    ],
    baseline: "N/N",
  },
};

export const LOCI: readonly LocusDefinition[] = LOCUS_IDS.map((id) => CATALOG[id]);

export function getLocus(id: LocusId): LocusDefinition {
  return CATALOG[id];
}

export interface SectionDefinition {
  readonly id: SectionId;
  readonly title: string;
  readonly loci: readonly LocusId[];
}

export const SECTIONS: readonly SectionDefinition[] = [
  { id: "color", title: "Color", loci: LOCUS_IDS.filter((id) => CATALOG[id].section === "color") },
  { id: "patterns", title: "Patterns", loci: LOCUS_IDS.filter((id) => CATALOG[id].section === "patterns") },
  { id: "coat", title: "Coat & Rare Traits", loci: LOCUS_IDS.filter((id) => CATALOG[id].section === "coat") },
];

/** Big Rope is a visual/conformation preference. It is never stored as an allele pair. */
export const BIG_ROPE_CONTROL = {
  name: "Big Rope",
  qualifier: "Visual/conformation choice — not a DNA locus",
  help: "A visual preference only, so it never enters litter math and its litter chance is unknown.",
  options: [
    { value: "off", label: "Off" },
    { value: "on", label: "On" },
  ],
} as const;

export function locusRowLabel(locus: LocusDefinition): string {
  return locus.locusLabel ? `${locus.name} / ${locus.locusLabel}` : locus.name;
}

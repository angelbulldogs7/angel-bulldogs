import { getLocus, locusRowLabel } from "../../data/color-lab/loci";
import { displayGenotype, requireOption } from "./genotype";
import type { GroupGenotype } from "./inheritance";
import type { Genotype, GenotypeStatus, LocusId, MaskedTraitCode } from "./types";
import { LOCUS_IDS } from "./types";

export const MASKED_TRAIT_TEXT: Readonly<Record<MaskedTraitCode, string>> = {
  "color-hidden-by-pink":
    "Pink hides the underlying color, Agouti, K, E, Merle, Pied, and Intensity DNA. That DNA is still inherited.",
  "pattern-hidden-by-cream":
    "The cream coat (e/e) hides Brindle, And Tan, Merle, and the mask. That DNA is still inherited.",
  "pigment-hidden-by-cream":
    "Brown, Cocoa, and Dilute do not change a cream coat's name unless they make Platinum.",
  "agouti-hidden-by-dominant-black": "Dominant Black (Kᴮ) hides the Agouti color and any Brindle.",
  "brindle-hidden-by-recessive-black":
    "Recessive Black (a/a) leaves no fawn areas where Brindle could show.",
  "sable-grouped-under-brindle": "Sable shading is not shown separately under Brindle.",
  "sable-grouped-under-intensity": "Sable shading is not shown separately on a Cream/White coat.",
  "husky-needs-ky-and-tan": "eᴬ shows Husky only with kʸ/kʸ and And Tan, so it stays in the DNA here.",
  "ea-with-dominant-black":
    "Some labs report that eᴬ can let the Agouti pattern show through Dominant Black. This simplified tool keeps Dominant Black.",
  "intensity-no-phaeomelanin":
    "Intensity Dilution has no visible fawn or red pigment to lighten on this coat.",
  "intensity-points-not-shown":
    "Intensity Dilution may lighten the tan areas. The representative image does not show that.",
  "mask-detail": "Melanistic mask (Eᴹ): shown in the image, never in the name.",
  "mask-not-distinguishable": "The Eᴹ mask is not distinguishable on this coat.",
  "merle-hidden": "Merle is in the DNA but has little or no black-based pigment to show on this coat.",
  "pied-hidden": "Pied white spotting is in the DNA but is not distinguishable on this pale coat.",
  "fluffy-hidden-by-hairless": "Hairless hides the Fluffy coat. The Fluffy DNA is still inherited.",
};

/** Codes already covered by a broader sentence in the same list. */
const COVERED_BY: Partial<Record<MaskedTraitCode, readonly MaskedTraitCode[]>> = {
  "merle-hidden": ["color-hidden-by-pink", "pattern-hidden-by-cream"],
  "pied-hidden": ["color-hidden-by-pink"],
};

export function maskedTraitSentences(codes: readonly MaskedTraitCode[]): string[] {
  const present = new Set(codes);
  const sentences: string[] = [];
  for (const code of codes) {
    const coveredBy = COVERED_BY[code];
    if (coveredBy?.some((other) => present.has(other))) continue;
    const text = MASKED_TRAIT_TEXT[code];
    if (!sentences.includes(text)) sentences.push(text);
  }
  return sentences;
}

export interface DnaRow {
  readonly locus: LocusId;
  readonly locusName: string;
  readonly genotypes: readonly { readonly display: string; readonly label: string; readonly status: GenotypeStatus }[];
}

export function dnaRowsForGenotype(genotype: Genotype): DnaRow[] {
  return LOCUS_IDS.map((locus) => {
    const option = requireOption(locus, genotype[locus]);
    return {
      locus,
      locusName: locusRowLabel(getLocus(locus)),
      genotypes: [{ display: displayGenotype(locus, option.id), label: option.label, status: option.status }],
    };
  });
}

export function dnaRowsForGroup(possible: Readonly<Record<LocusId, readonly GroupGenotype[]>>): DnaRow[] {
  return LOCUS_IDS.map((locus) => ({
    locus,
    locusName: locusRowLabel(getLocus(locus)),
    genotypes: possible[locus].map((item) => ({ display: item.display, label: item.label, status: item.status })),
  }));
}

/** Plain-language carrier lines for one dog, e.g. "Carries Dilute (D/d)". */
export function carrierSentences(genotype: Genotype): string[] {
  return LOCUS_IDS.flatMap((locus) => {
    const option = requireOption(locus, genotype[locus]);
    return option.status === "carrier" ? [`${option.label} (${displayGenotype(locus, option.id)})`] : [];
  });
}

import { getLocus } from "../../data/color-lab/loci";
import {
  INTENSITY_SUBTITLE,
  MERLE_VISIBLE_ON,
  PIED_VISIBLE_ON,
  TRICOLOR_ALIAS,
  pigmentFamily,
  pigmentName,
} from "../../data/color-lab/phenotypeNames";
import { requireOption } from "./genotype";
import { composeName } from "./naming";
import type {
  AsipClass,
  CoatClass,
  Copies,
  DogState,
  EClass,
  ExpressionProfile,
  EyeTreatment,
  Genotype,
  KClass,
  LocusId,
  MaskedTraitCode,
  NameTokens,
  NonviableConception,
  NoticeCode,
  PhenotypeResult,
  PigmentFamily,
  VisualBase,
  VisualRecipe,
} from "./types";
import { LOCUS_IDS } from "./types";

export type ProfileContribution = Partial<ExpressionProfile>;

function topAllele(locus: LocusId, alleles: readonly [string, string]): string {
  for (const candidate of getLocus(locus).alleles) {
    if (alleles[0] === candidate.id || alleles[1] === candidate.id) return candidate.id;
  }
  throw new Error(`No known allele found for ${locus}.`);
}

function asAsip(id: string): AsipClass {
  if (id === "ady" || id === "asy" || id === "abb" || id === "a") return id;
  throw new Error(`Unexpected Agouti allele: ${id}`);
}

function asK(id: string): KClass {
  if (id === "KB" || id === "kbr" || id === "ky") return id;
  throw new Error(`Unexpected K allele: ${id}`);
}

function asE(id: string): EClass {
  if (id === "Em" || id === "E" || id === "eA" || id === "e") return id;
  throw new Error(`Unexpected E allele: ${id}`);
}

function copiesOf(alleles: readonly [string, string], id: string): Copies {
  const first = alleles[0] === id;
  const second = alleles[1] === id;
  if (first && second) return 2;
  return first || second ? 1 : 0;
}

function homozygous(alleles: readonly [string, string], id: string): boolean {
  return alleles[0] === id && alleles[1] === id;
}

/**
 * The only facts one locus contributes to appearance. Genotypes with equal contributions are
 * visually interchangeable, which is what lets litter math aggregate exactly and cheaply.
 */
export function locusContribution(locus: LocusId, optionId: string): ProfileContribution {
  const { alleles } = requireOption(locus, optionId);
  switch (locus) {
    case "asip":
      return { asip: asAsip(topAllele(locus, alleles)) };
    case "dilute":
      return { dilute: homozygous(alleles, "d") };
    case "cocoa":
      return { cocoa: homozygous(alleles, "co") };
    case "tyrp1":
      return { brown: homozygous(alleles, "b") };
    case "k":
      return { k: asK(topAllele(locus, alleles)) };
    case "mc1r":
      return { e: asE(topAllele(locus, alleles)) };
    case "mitf":
      return { pied: homozygous(alleles, "S") };
    case "merle":
      return { merle: copiesOf(alleles, "M") };
    case "fgf5":
      return { fluffy: homozygous(alleles, "l") };
    case "intensity":
      return { intensity: homozygous(alleles, "In") };
    case "slc45a2":
      return { pink: homozygous(alleles, "alb") };
    case "foxi3":
      return { hairless: copiesOf(alleles, "Dup") };
  }
}

export function completeProfile(partial: ProfileContribution): ExpressionProfile {
  const { asip, k, e, brown, cocoa, dilute, pied, merle, fluffy, intensity, pink, hairless } = partial;
  if (
    asip === undefined ||
    k === undefined ||
    e === undefined ||
    brown === undefined ||
    cocoa === undefined ||
    dilute === undefined ||
    pied === undefined ||
    merle === undefined ||
    fluffy === undefined ||
    intensity === undefined ||
    pink === undefined ||
    hairless === undefined
  ) {
    throw new Error("Incomplete expression profile.");
  }
  return { asip, k, e, brown, cocoa, dilute, pied, merle, fluffy, intensity, pink, hairless };
}

export function profileFromGenotype(genotype: Genotype): ExpressionProfile {
  let partial: ProfileContribution = {};
  for (const locus of LOCUS_IDS) {
    partial = { ...partial, ...locusContribution(locus, genotype[locus]) };
  }
  return completeProfile(partial);
}

interface CoatResolution {
  readonly coat: CoatClass;
  readonly color: string;
  readonly pattern: "And Tan" | "Husky" | null;
  readonly brindle: boolean;
  readonly mask: boolean;
  readonly subtitle: string | null;
  readonly showsPigment: boolean;
}

const PLAIN = { pattern: null, brindle: false, mask: false, subtitle: null } as const;

/** Steps 3–8: Pink, e/e Cream/Platinum, Intensity, E compatibility, K, Agouti, pigment names. */
function resolveCoat(p: ExpressionProfile, pigment: PigmentFamily, masked: MaskedTraitCode[]): CoatResolution {
  if (p.pink) {
    masked.push("color-hidden-by-pink");
    return { ...PLAIN, coat: "pink", color: "Pink", showsPigment: false };
  }

  if (p.e === "e") {
    masked.push("pattern-hidden-by-cream");
    if (p.cocoa && p.dilute) {
      const color = p.brown ? "Platinum New Shade Isabella" : "Platinum";
      return { ...PLAIN, coat: "platinum", color, showsPigment: false };
    }
    if (pigment !== "black") masked.push("pigment-hidden-by-cream");
    return { ...PLAIN, coat: "cream", color: "Cream", showsPigment: false };
  }

  const family = pigmentName(pigment);

  if (p.k === "KB" || p.asip === "a") {
    if (p.k === "KB" && p.asip !== "a") masked.push("agouti-hidden-by-dominant-black");
    if (p.k === "kbr") masked.push("brindle-hidden-by-recessive-black");
    if (p.e === "eA") masked.push(p.k === "KB" ? "ea-with-dominant-black" : "husky-needs-ky-and-tan");
    if (p.e === "Em") masked.push("mask-not-distinguishable");
    if (p.intensity) masked.push("intensity-no-phaeomelanin");
    return { ...PLAIN, coat: "solid", color: family, showsPigment: true };
  }

  const brindle = p.k === "kbr";

  if (p.asip === "abb") {
    const husky = p.e === "eA" && p.k === "ky";
    if (p.e === "eA" && !husky) masked.push("husky-needs-ky-and-tan");
    if (p.e === "Em") masked.push("mask-not-distinguishable");
    if (p.intensity) masked.push("intensity-points-not-shown");
    return {
      coat: husky ? "husky" : "and-tan",
      color: family,
      pattern: husky ? "Husky" : "And Tan",
      brindle,
      mask: false,
      subtitle: null,
      showsPigment: true,
    };
  }

  // Fawn (Aᴰʸ) or Sable (Aˢʸ): a phaeomelanin-based coat.
  if (p.e === "eA") masked.push("husky-needs-ky-and-tan");
  if (brindle && p.asip === "asy") masked.push("sable-grouped-under-brindle");
  const mask = p.e === "Em" && !brindle;
  if (p.e === "Em") masked.push(mask ? "mask-detail" : "mask-not-distinguishable");

  if (p.intensity) {
    if (!brindle && p.asip === "asy") masked.push("sable-grouped-under-intensity");
    return {
      coat: "cream-white",
      color: "Cream/White",
      pattern: null,
      brindle,
      mask,
      subtitle: INTENSITY_SUBTITLE,
      showsPigment: true,
    };
  }

  const ground = !brindle && p.asip === "asy" ? "Sable" : "Fawn";
  const color = pigment === "black" ? ground : brindle ? family : `${family} ${ground}`;
  return {
    coat: ground === "Sable" ? "sable" : "fawn",
    color,
    pattern: null,
    brindle,
    mask,
    subtitle: null,
    showsPigment: true,
  };
}

export const NONVIABLE_CONCEPTION: NonviableConception = {
  kind: "nonviable",
  reason: "foxi3-dup-dup",
  publicName: "Nonviable at conception",
  notices: ["nonviable-dup-dup"],
  key: "nonviable|foxi3-dup-dup",
};

function eyesFor(coat: CoatClass, merleVisible: boolean): EyeTreatment {
  if (coat === "pink") return "light-blue";
  return merleVisible ? "blue" : "dark-brown";
}

/**
 * Ordered pipeline:
 * 1. FOXI3 Dup/Dup → nonviable conception (never a puppy).
 * 2. FOXI3 N/Dup → Hairless coat structure.
 * 3. Pink → primary color; everything else stays in Hidden DNA.
 * 4. e/e → Cream, Platinum, or Platinum New Shade Isabella.
 * 5. In/In → Cream/White only where phaeomelanin shows.
 * 6–8. E compatibility (mask, Husky), K, Agouti, then the eight pigment names.
 * 9. Brindle, Merle, and Pied visibility after masking.
 * 10. Fluffy unless Hairless. 11. Big Rope as a visual preference only.
 */
export function resolveProfile(
  profile: ExpressionProfile,
  options: { readonly bigRope: boolean } = { bigRope: false },
): PhenotypeResult {
  if (profile.hairless === 2) return NONVIABLE_CONCEPTION;

  const masked: MaskedTraitCode[] = [];
  const hairless = profile.hairless === 1;
  if (hairless && profile.fluffy) masked.push("fluffy-hidden-by-hairless");

  const pigment = pigmentFamily(profile);
  const coat = resolveCoat(profile, pigment, masked);

  const merleVisible = profile.merle > 0 && (MERLE_VISIBLE_ON[coat.coat] || coat.brindle);
  if (profile.merle > 0 && !merleVisible) masked.push("merle-hidden");

  const piedVisible = profile.pied && PIED_VISIBLE_ON[coat.coat];
  if (profile.pied && !piedVisible) masked.push("pied-hidden");

  const tokens: NameTokens = {
    hairless,
    color: coat.color,
    pattern: coat.pattern,
    brindle: coat.brindle,
    merle: merleVisible ? (profile.merle === 2 ? "Double Merle" : "Merle") : null,
    pied: piedVisible,
    solid: coat.pattern === null && !coat.brindle && !merleVisible && !piedVisible,
    fluffy: profile.fluffy && !hairless,
    bigRope: options.bigRope,
  };

  const base: VisualBase = hairless ? "hairless" : profile.fluffy ? "fluffy" : "standard";
  const recipe: VisualRecipe = {
    base,
    coat: coat.coat,
    pigment: coat.showsPigment ? pigment : null,
    mask: coat.mask,
    brindle: coat.brindle,
    merle: merleVisible,
    pied: piedVisible,
    eyes: eyesFor(coat.coat, merleVisible),
    bigRope: options.bigRope,
  };

  const notices: NoticeCode[] = [];
  if (profile.merle === 2) notices.push("double-merle");
  if (profile.merle > 0) notices.push("merle-simplified");
  if (piedVisible) notices.push("pied-variable");
  if (hairless) notices.push("hairless-dentition");
  if (profile.pink) notices.push("pink-albinism");
  if (coat.subtitle) notices.push("intensity-dilution");
  if (options.bigRope) notices.push("big-rope-visual");

  const publicName = composeName(tokens);
  const aliases = coat.pattern === "And Tan" && piedVisible ? [TRICOLOR_ALIAS] : [];
  const core = {
    publicName,
    subtitle: coat.subtitle,
    aliases,
    tokens,
    coat: coat.coat,
    pigment,
    recipe,
    masked,
    notices,
    profile,
  };

  if (profile.merle === 2) {
    return {
      ...core,
      kind: "concerning",
      concern: "double-merle",
      merleVisible,
      key: `concerning|${publicName}|${coat.subtitle ?? ""}`,
    };
  }
  return { ...core, kind: "viable", key: `viable|${publicName}|${coat.subtitle ?? ""}` };
}

export function resolvePhenotype(
  genotype: Genotype,
  options: { readonly bigRope: boolean } = { bigRope: false },
): PhenotypeResult {
  return resolveProfile(profileFromGenotype(genotype), options);
}

export function resolveDog(state: DogState): PhenotypeResult {
  return resolvePhenotype(state.genotype, { bigRope: state.bigRope });
}

import { LOCI, getLocus } from "../../data/color-lab/loci";
import type { Genotype, GenotypeOption, LocusId } from "./types";
import { LOCUS_IDS } from "./types";

export function getOption(locus: LocusId, optionId: string): GenotypeOption | undefined {
  return getLocus(locus).options.find((option) => option.id === optionId);
}

export function requireOption(locus: LocusId, optionId: string): GenotypeOption {
  const option = getOption(locus, optionId);
  if (!option) throw new Error(`Unknown ${locus} genotype: ${optionId}`);
  return option;
}

export function isSelectableOption(locus: LocusId, optionId: string): boolean {
  return getOption(locus, optionId)?.selectable === true;
}

export function alleleRank(locus: LocusId, alleleId: string): number {
  return getLocus(locus).alleles.findIndex((item) => item.id === alleleId);
}

/** Unordered pair → canonical option ID (most dominant allele first). */
export function canonicalOptionId(locus: LocusId, a: string, b: string): string {
  const ra = alleleRank(locus, a);
  const rb = alleleRank(locus, b);
  if (ra === -1 || rb === -1) throw new Error(`Unknown ${locus} allele: ${a}, ${b}`);
  const id = ra <= rb ? `${a}/${b}` : `${b}/${a}`;
  requireOption(locus, id);
  return id;
}

export function alleleSymbol(locus: LocusId, alleleId: string): string {
  return getLocus(locus).alleles.find((item) => item.id === alleleId)?.symbol ?? alleleId;
}

/** Display notation such as `Aᴰʸ/Aˢʸ`. */
export function displayGenotype(locus: LocusId, optionId: string): string {
  const [a, b] = requireOption(locus, optionId).alleles;
  return `${alleleSymbol(locus, a)}/${alleleSymbol(locus, b)}`;
}

/** Select-option text such as `Carries Dilute — D/d`. */
export function optionText(locus: LocusId, optionId: string): string {
  return `${requireOption(locus, optionId).label} — ${displayGenotype(locus, optionId)}`;
}

export function baselineGenotype(): Genotype {
  const genotype = {} as Record<LocusId, string>;
  for (const locus of LOCI) genotype[locus.id] = locus.baseline;
  return genotype;
}

export function genotypesEqual(a: Genotype, b: Genotype): boolean {
  return LOCUS_IDS.every((id) => a[id] === b[id]);
}

export function isCompleteGenotype(value: Partial<Record<LocusId, string>>): value is Genotype {
  return LOCUS_IDS.every((id) => {
    const option = value[id];
    return typeof option === "string" && isSelectableOption(id, option);
  });
}

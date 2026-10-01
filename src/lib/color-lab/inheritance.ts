import { getLocus } from "../../data/color-lab/loci";
import { canonicalOptionId, displayGenotype, requireOption } from "./genotype";
import {
  completeProfile,
  locusContribution,
  resolveProfile,
  type ProfileContribution,
} from "./phenotypeResolver";
import {
  allocatePercents,
  formatShare,
  reduceFraction,
  type Fraction,
} from "./probabilityFormatting";
import { interestEligibility, pairingWarnings, type PairingWarning } from "./safetyRules";
import type {
  Genotype,
  GenotypeStatus,
  InterestEligibility,
  LocusId,
  MaskedTraitCode,
  VisiblePhenotype,
} from "./types";
import { COLOR_LAB_RULESET_VERSION, LOCUS_IDS } from "./types";
import { visibleSignature } from "./visualRecipe";

/** Each locus cross has 2 × 2 equally likely gamete pairings. */
export const OUTCOMES_PER_LOCUS = 4;
/** Every conception weight is an integer out of this denominator (4^12 = 16,777,216). */
export const CONCEPTION_DENOMINATOR = OUTCOMES_PER_LOCUS ** LOCUS_IDS.length;

export interface WeightedOption {
  readonly option: string;
  /** Out of OUTCOMES_PER_LOCUS. */
  readonly weight: number;
}

export function gametes(locus: LocusId, optionId: string): { allele: string; weight: 1 | 2 }[] {
  const [a, b] = requireOption(locus, optionId).alleles;
  return a === b ? [{ allele: a, weight: 2 }] : [{ allele: a, weight: 1 }, { allele: b, weight: 1 }];
}

/** Child genotype distribution at one locus, canonicalized and in catalog order. */
export function crossLocus(locus: LocusId, stud: string, dam: string): WeightedOption[] {
  const totals = new Map<string, number>();
  for (const s of gametes(locus, stud)) {
    for (const d of gametes(locus, dam)) {
      const option = canonicalOptionId(locus, s.allele, d.allele);
      totals.set(option, (totals.get(option) ?? 0) + s.weight * d.weight);
    }
  }
  return getLocus(locus)
    .options.filter((item) => totals.has(item.id))
    .map((item) => ({ option: item.id, weight: totals.get(item.id) ?? 0 }));
}

export interface ConceptionShare {
  /** Out of CONCEPTION_DENOMINATOR. */
  readonly weight: number;
  readonly exact: Fraction;
  readonly percent: string;
}

export interface LocusOutcomeRow {
  readonly option: string;
  readonly display: string;
  readonly label: string;
  readonly status: GenotypeStatus;
  readonly exact: Fraction;
  readonly percent: string;
}

export interface LocusOutcome {
  readonly locus: LocusId;
  readonly rows: readonly LocusOutcomeRow[];
}

export interface GroupGenotype {
  readonly option: string;
  readonly display: string;
  readonly label: string;
  readonly status: GenotypeStatus;
  /** Probability of this genotype among puppies in the phenotype group. */
  readonly exactWithinGroup: Fraction;
  readonly percentWithinGroup: string;
}

export interface PhenotypeGroup {
  readonly key: string;
  /** The most likely visual variant of the group; every variant shares the public name. */
  readonly result: VisiblePhenotype;
  readonly weight: number;
  readonly exact: Fraction;
  /** Per conception, largest-remainder allocated with every other group and Dup/Dup. */
  readonly percent: string;
  /** Among potentially viable conceptions; only present when Dup/Dup is possible. */
  readonly viablePercent: string | null;
  readonly possibleGenotypes: Readonly<Record<LocusId, readonly GroupGenotype[]>>;
  readonly masked: readonly MaskedTraitCode[];
  readonly visualVariantCount: number;
  readonly eligibility: InterestEligibility;
}

export interface LitterResult {
  readonly rulesetVersion: string;
  readonly denominator: number;
  readonly groups: readonly PhenotypeGroup[];
  readonly nonviable: ConceptionShare | null;
  readonly viableTotal: ConceptionShare;
  readonly doubleMerle: ConceptionShare | null;
  readonly loci: readonly LocusOutcome[];
  readonly pairing: readonly PairingWarning[];
  readonly mostLikely: { readonly names: readonly string[]; readonly percent: string } | null;
}

interface ClassGroup {
  readonly key: string;
  readonly contribution: ProfileContribution;
  weight: number;
  readonly options: WeightedOption[];
}

function classGroups(locus: LocusId, rows: readonly WeightedOption[]): ClassGroup[] {
  const groups = new Map<string, ClassGroup>();
  for (const row of rows) {
    const contribution = locusContribution(locus, row.option);
    const key = JSON.stringify(contribution);
    const existing = groups.get(key);
    if (existing) {
      existing.weight += row.weight;
      existing.options.push(row);
    } else {
      groups.set(key, { key, contribution, weight: row.weight, options: [row] });
    }
  }
  return [...groups.values()];
}

interface GroupAccumulator {
  weight: number;
  readonly variants: Map<string, { weight: number; result: VisiblePhenotype }>;
  readonly classWeights: Map<string, number>[];
  readonly masked: Set<MaskedTraitCode>;
}

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** FOXI3 first so Dup/Dup branches are counted without enumerating the other loci. */
const DP_ORDER: readonly LocusId[] = ["foxi3", ...LOCUS_IDS.filter((id) => id !== "foxi3")];

export function calculateLitter(stud: Genotype, dam: Genotype): LitterResult {
  const perLocus = DP_ORDER.map((locus) => classGroups(locus, crossLocus(locus, stud[locus], dam[locus])));
  const accumulators = new Map<string, GroupAccumulator>();
  const chosen: ClassGroup[] = [];
  let nonviableWeight = 0;

  const leaf = (weight: number, partial: ProfileContribution): void => {
    const result = resolveProfile(completeProfile(partial), { bigRope: false });
    if (result.kind === "nonviable") {
      nonviableWeight += weight;
      return;
    }
    let acc = accumulators.get(result.key);
    if (!acc) {
      acc = {
        weight: 0,
        variants: new Map(),
        classWeights: DP_ORDER.map(() => new Map<string, number>()),
        masked: new Set(),
      };
      accumulators.set(result.key, acc);
    }
    acc.weight += weight;
    const signature = visibleSignature(result.recipe);
    const variant = acc.variants.get(signature);
    if (variant) variant.weight += weight;
    else acc.variants.set(signature, { weight, result });
    for (let index = 0; index < DP_ORDER.length; index += 1) {
      const classes = acc.classWeights[index];
      const key = chosen[index].key;
      classes.set(key, (classes.get(key) ?? 0) + weight);
    }
    for (const code of result.masked) acc.masked.add(code);
  };

  const visit = (depth: number, weight: number, partial: ProfileContribution): void => {
    if (depth === DP_ORDER.length) {
      leaf(weight, partial);
      return;
    }
    for (const group of perLocus[depth]) {
      if (DP_ORDER[depth] === "foxi3" && group.contribution.hairless === 2) {
        nonviableWeight += weight * group.weight * OUTCOMES_PER_LOCUS ** (DP_ORDER.length - depth - 1);
        continue;
      }
      chosen[depth] = group;
      visit(depth + 1, weight * group.weight, { ...partial, ...group.contribution });
    }
  };
  visit(0, 1, {});

  const denominator = CONCEPTION_DENOMINATOR;
  const unsorted = [...accumulators.entries()].map(([key, acc]) => ({ key, acc, rep: representative(acc) }));
  unsorted.sort(
    (a, b) =>
      b.acc.weight - a.acc.weight ||
      compareText(a.rep.publicName, b.rep.publicName) ||
      compareText(a.key, b.key),
  );

  const conceptionWeights = unsorted.map((item) => item.acc.weight);
  if (nonviableWeight > 0) conceptionWeights.push(nonviableWeight);
  const conceptionPercents = allocatePercents(conceptionWeights);
  const viablePercents =
    nonviableWeight > 0 && unsorted.length > 0
      ? allocatePercents(unsorted.map((item) => item.acc.weight))
      : null;

  const groups: PhenotypeGroup[] = unsorted.map(({ key, acc, rep: result }, index) => {
    return {
      key,
      result,
      weight: acc.weight,
      exact: reduceFraction(acc.weight, denominator),
      percent: conceptionPercents[index] ?? "0.00",
      viablePercent: viablePercents ? (viablePercents[index] ?? "0.00") : null,
      possibleGenotypes: possibleGenotypes(acc, perLocus),
      masked: [...acc.masked],
      visualVariantCount: acc.variants.size,
      eligibility: interestEligibility(result),
    };
  });

  const nonviable =
    nonviableWeight > 0
      ? {
          weight: nonviableWeight,
          exact: reduceFraction(nonviableWeight, denominator),
          percent: conceptionPercents[conceptionPercents.length - 1] ?? "0.00",
        }
      : null;

  const viableWeight = denominator - nonviableWeight;
  const loci = LOCUS_IDS.map((locus) => locusOutcome(locus, stud[locus], dam[locus]));
  const merleRow = loci.find((item) => item.locus === "merle")?.rows.find((row) => row.option === "M/M");
  const doubleMerleWeight = merleRow ? (merleRow.exact.numerator * denominator) / merleRow.exact.denominator : 0;

  const top = groups[0];
  const mostLikely = top
    ? {
        names: groups.filter((group) => group.weight === top.weight).map((group) => group.result.publicName),
        percent: top.percent,
      }
    : null;

  return {
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    denominator,
    groups,
    nonviable,
    viableTotal: {
      weight: viableWeight,
      exact: reduceFraction(viableWeight, denominator),
      percent: formatShare(viableWeight, denominator),
    },
    doubleMerle:
      doubleMerleWeight > 0
        ? {
            weight: doubleMerleWeight,
            exact: reduceFraction(doubleMerleWeight, denominator),
            percent: formatShare(doubleMerleWeight, denominator),
          }
        : null,
    loci,
    pairing: pairingWarnings(stud, dam),
    mostLikely,
  };
}

function representative(acc: GroupAccumulator): VisiblePhenotype {
  let best: { signature: string; weight: number; result: VisiblePhenotype } | null = null;
  for (const [signature, variant] of acc.variants) {
    if (
      !best ||
      variant.weight > best.weight ||
      (variant.weight === best.weight && compareText(signature, best.signature) < 0)
    ) {
      best = { signature, weight: variant.weight, result: variant.result };
    }
  }
  if (!best) throw new Error("Phenotype group has no visual variants.");
  return best.result;
}

function possibleGenotypes(
  acc: GroupAccumulator,
  perLocus: readonly ClassGroup[][],
): Record<LocusId, GroupGenotype[]> {
  const output = {} as Record<LocusId, GroupGenotype[]>;
  DP_ORDER.forEach((locus, index) => {
    const entries: { option: string; classWeight: number; rowWeight: number; classTotal: number }[] = [];
    for (const [classKey, classWeight] of acc.classWeights[index]) {
      const group = perLocus[index].find((item) => item.key === classKey);
      if (!group) continue;
      for (const row of group.options) {
        entries.push({ option: row.option, classWeight, rowWeight: row.weight, classTotal: group.weight });
      }
    }
    const order = getLocus(locus).options.map((item) => item.id);
    entries.sort((a, b) => order.indexOf(a.option) - order.indexOf(b.option));
    // A class total is 1–4, so ×12 makes every within-group share an exact integer weight.
    const scaled = entries.map((entry) => (entry.classWeight * entry.rowWeight * 12) / entry.classTotal);
    const percents = allocatePercents(scaled);
    output[locus] = entries.map((entry, entryIndex) => {
      const option = requireOption(locus, entry.option);
      return {
        option: entry.option,
        display: displayGenotype(locus, entry.option),
        label: option.label,
        status: option.status,
        exactWithinGroup: reduceFraction(entry.classWeight * entry.rowWeight, entry.classTotal * acc.weight),
        percentWithinGroup: percents[entryIndex] ?? "0.00",
      };
    });
  });
  return output;
}

function locusOutcome(locus: LocusId, stud: string, dam: string): LocusOutcome {
  const rows = crossLocus(locus, stud, dam);
  const percents = allocatePercents(rows.map((row) => row.weight));
  return {
    locus,
    rows: rows.map((row, index) => {
      const option = requireOption(locus, row.option);
      return {
        option: row.option,
        display: displayGenotype(locus, row.option),
        label: option.label,
        status: option.status,
        exact: reduceFraction(row.weight, OUTCOMES_PER_LOCUS),
        percent: percents[index] ?? "0.00",
      };
    }),
  };
}

import { LOCUS_IDS, getLocus } from "../../data/color-lab/loci";
import { addFrac, frac, mulFrac, type Fraction } from "./fractions";
import { canonicalizePair, formatPair } from "./genotype";
import {
  applyLocusToState,
  emptyPhenotypeState,
  locusExpression,
  resolveFromState,
  stateKey,
  type PhenotypeState,
} from "./phenotypeResolver";
import { attachDisplayPercents, formatShareOfWhole } from "./probabilityFormatting";
import { flagsForPairing } from "./safetyRules";
import type {
  AllelePair,
  BreedingResult,
  Genotype,
  LocusGenotypeOutcome,
  LocusId,
  PhenotypeOutcome,
} from "./types";

export interface WeightedPair {
  pair: AllelePair;
  weight: Fraction;
}

export function gameteDistribution(pair: AllelePair): { allele: string; weight: Fraction }[] {
  if (pair[0] === pair[1]) return [{ allele: pair[0], weight: frac(1n) }];
  return [
    { allele: pair[0], weight: frac(1n, 2n) },
    { allele: pair[1], weight: frac(1n, 2n) },
  ];
}

export function punnettSquare(sire: AllelePair, dam: AllelePair, locusId: LocusId): WeightedPair[] {
  const merged = new Map<string, WeightedPair>();
  for (const s of gameteDistribution(sire)) {
    for (const d of gameteDistribution(dam)) {
      const pair = canonicalizePair(locusId, s.allele, d.allele);
      const weight = mulFrac(s.weight, d.weight);
      const key = `${pair[0]}/${pair[1]}`;
      const existing = merged.get(key);
      if (existing) {
        existing.weight = addFrac(existing.weight, weight);
      } else {
        merged.set(key, { pair, weight });
      }
    }
  }
  return [...merged.values()];
}

function compareOutcomes(a: PhenotypeOutcome, b: PhenotypeOutcome): number {
  if (a.numerator * b.denominator !== b.numerator * a.denominator) {
    return a.numerator * b.denominator > b.numerator * a.denominator ? -1 : 1;
  }
  return a.phenotype.commonName.localeCompare(b.phenotype.commonName);
}

export function calculateBreeding(sire: Genotype, dam: Genotype): BreedingResult {
  type Node = { state: PhenotypeState; weight: Fraction };
  let nodes = new Map<string, Node>();
  const initial = emptyPhenotypeState();
  nodes.set(stateKey(initial), { state: initial, weight: frac(1n) });

  for (const locusId of LOCUS_IDS) {
    const outcomes = punnettSquare(sire[locusId], dam[locusId], locusId);
    const next = new Map<string, Node>();
    for (const node of nodes.values()) {
      for (const outcome of outcomes) {
        const state = applyLocusToState(node.state, locusId, outcome.pair);
        const weight = mulFrac(node.weight, outcome.weight);
        const key = stateKey(state);
        const existing = next.get(key);
        if (existing) {
          existing.weight = addFrac(existing.weight, weight);
        } else {
          next.set(key, { state, weight });
        }
      }
    }
    nodes = next;
  }

  const bySlug = new Map<string, { phenotype: ReturnType<typeof resolveFromState>; weight: Fraction }>();
  for (const node of nodes.values()) {
    const phenotype = resolveFromState(node.state);
    const existing = bySlug.get(phenotype.slug);
    if (existing) {
      existing.weight = addFrac(existing.weight, node.weight);
    } else {
      bySlug.set(phenotype.slug, { phenotype, weight: node.weight });
    }
  }

  const conceptionRaw = [...bySlug.values()].map((item) => ({
    phenotype: item.phenotype,
    numerator: item.weight.n,
    denominator: item.weight.d,
  }));
  const conceptionOutcomes = attachDisplayPercents(conceptionRaw).sort(compareOutcomes);

  const lethal = [...bySlug.values()]
    .filter((item) => item.phenotype.nonviable)
    .reduce((sum, item) => addFrac(sum, item.weight), frac(0n));

  const viableSource = [...bySlug.values()].filter((item) => !item.phenotype.nonviable);
  const viableRenormalized = lethal.n > 0n && viableSource.length > 0;
  const viableRaw = viableSource.map((item) => {
    if (!viableRenormalized) {
      return { phenotype: item.phenotype, numerator: item.weight.n, denominator: item.weight.d };
    }
    const renormalized = { n: item.weight.n * lethal.d, d: item.weight.d * (lethal.d - lethal.n) };
    return { phenotype: item.phenotype, numerator: renormalized.n, denominator: renormalized.d };
  });
  const viableOutcomes = attachDisplayPercents(viableRaw).sort(compareOutcomes);

  const liveCards = conceptionOutcomes.filter((item) => !item.phenotype.nonviable);
  const top = liveCards[0]?.rawProbability ?? 0;
  const mostLikelyNames = liveCards
    .filter((item) => item.rawProbability === top)
    .map((item) => item.phenotype.commonName);
  const tiesForMostLikely = mostLikelyNames.length > 1;

  const pairingFlags = flagsForPairing(sire, dam);

  return {
    conceptionOutcomes,
    viableOutcomes,
    viableRenormalized,
    nonviableConceptionFraction: lethal,
    nonviableDisplayPercent: formatShareOfWhole(lethal),
    locusOutcomes: LOCUS_IDS.map((id) => locusOutcomes(sire[id], dam[id], id)),
    pairingFlags,
    tiesForMostLikely,
    mostLikelyNames,
  };
}

export function locusOutcomes(sire: AllelePair, dam: AllelePair, locusId: LocusId): LocusGenotypeOutcome[] {
  const rows = punnettSquare(sire, dam, locusId).map((item) => ({
    locusId,
    pair: item.pair,
    label: `${getLocus(locusId).notation} ${formatPair(locusId, item.pair)}`,
    numerator: item.weight.n,
    denominator: item.weight.d,
    expression: locusExpression(locusId, item.pair),
  }));
  return attachDisplayPercents(rows).sort((a, b) => {
    if (a.numerator * b.denominator !== b.numerator * a.denominator) {
      return a.numerator * b.denominator > b.numerator * a.denominator ? -1 : 1;
    }
    return a.label.localeCompare(b.label);
  });
}

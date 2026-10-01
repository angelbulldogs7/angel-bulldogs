import type { AllelePair, Genotype, LocusId, ProvenanceMap } from "./types";
import { LOCI, LOCUS_IDS, getLocus } from "../../data/color-lab/loci";

export function pairKey(pair: AllelePair): string {
  return `${pair[0]}/${pair[1]}`;
}

export function canonicalizePair(locusId: LocusId, a: string, b: string): AllelePair {
  const order = getLocus(locusId).displayOrder;
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia === -1 || ib === -1) {
    throw new Error(`Unknown allele for ${locusId}: ${a}, ${b}`);
  }
  return ia <= ib ? [a, b] : [b, a];
}

export function formatPair(locusId: LocusId, pair: AllelePair): string {
  const locus = getLocus(locusId);
  const a = locus.alleles.find((item) => item.id === pair[0]);
  const b = locus.alleles.find((item) => item.id === pair[1]);
  return `${a?.label ?? pair[0]}/${b?.label ?? pair[1]}`;
}

export function hasAllele(pair: AllelePair, id: string): boolean {
  return pair[0] === id || pair[1] === id;
}

export function countAllele(pair: AllelePair, id: string): 0 | 1 | 2 {
  return ((pair[0] === id ? 1 : 0) + (pair[1] === id ? 1 : 0)) as 0 | 1 | 2;
}

export function bothAre(pair: AllelePair, predicate: (id: string) => boolean): boolean {
  return predicate(pair[0]) && predicate(pair[1]);
}

export function cloneGenotype(genotype: Genotype): Genotype {
  const next = {} as Genotype;
  for (const id of LOCUS_IDS) {
    next[id] = [genotype[id][0], genotype[id][1]];
  }
  return next;
}

export function assumedProvenance(): ProvenanceMap {
  const map = {} as ProvenanceMap;
  for (const id of LOCUS_IDS) {
    map[id] = "assumed";
  }
  return map;
}

export function defaultGenotype(): Genotype {
  const genotype = {} as Genotype;
  for (const locus of LOCI) {
    genotype[locus.id] = [locus.defaultPair[0], locus.defaultPair[1]];
  }
  return genotype;
}

export function genotypeSummary(genotype: Genotype): string {
  return LOCI.map((locus) => `${locus.notation} ${formatPair(locus.id, genotype[locus.id])}`).join(
    " · ",
  );
}

export function pairsEqual(a: AllelePair, b: AllelePair): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function genotypesEqual(a: Genotype, b: Genotype): boolean {
  return LOCUS_IDS.every((id) => pairsEqual(a[id], b[id]));
}

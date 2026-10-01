import type { LocusId } from "../../lib/color-lab/types";

export type AliasFidelity = "exact" | "collapsed";

export interface AliasTarget {
  readonly allele: string;
  readonly fidelity: AliasFidelity;
}

function exact(allele: string): AliasTarget {
  return { allele, fidelity: "exact" };
}

function collapsed(allele: string): AliasTarget {
  return { allele, fidelity: "collapsed" };
}

/**
 * Case-sensitive per-locus aliases for saved v1 records and common lab notation.
 * "collapsed" means molecular detail is lost (for example d2 → d), which clears Lab-confirmed.
 * Values not listed — such as Agouti/wolf sable (AG, aʷ) — are not mapped: the locus falls
 * back to baseline rather than inventing DNA. A bare "L" is deliberately absent at FGF5
 * because UC Davis uses it for the long-hair variant while this tool uses it for Standard.
 */
export const ALLELE_ALIASES: Readonly<Record<LocusId, Readonly<Record<string, AliasTarget>>>> = {
  asip: {
    ady: exact("ady"),
    dy: exact("ady"),
    DY: exact("ady"),
    ASIPDY: exact("ady"),
    Ay: exact("ady"),
    ay: exact("ady"),
    asy: exact("asy"),
    sy: exact("asy"),
    SY: exact("asy"),
    ASIPSY: exact("asy"),
    abb: exact("abb"),
    BB: exact("abb"),
    ASIPBB: exact("abb"),
    BB1: collapsed("abb"),
    BB2: collapsed("abb"),
    BB3: collapsed("abb"),
    ASIPBB1: collapsed("abb"),
    ASIPBB2: collapsed("abb"),
    ASIPBB3: collapsed("abb"),
    bs: collapsed("abb"),
    BS: collapsed("abb"),
    ASIPBS: collapsed("abb"),
    at: collapsed("abb"),
    "a^t": collapsed("abb"),
    "aᵗ": collapsed("abb"),
    a: exact("a"),
    ASIPa: exact("a"),
  },
  dilute: {
    D: exact("D"),
    d: exact("d"),
    d1: collapsed("d"),
    d2: collapsed("d"),
    d3: collapsed("d"),
  },
  cocoa: {
    Co: exact("Co"),
    CO: exact("Co"),
    co: exact("co"),
  },
  tyrp1: {
    B: exact("B"),
    b: exact("b"),
    bs: collapsed("b"),
    bd: collapsed("b"),
    bc: collapsed("b"),
    "b^s": collapsed("b"),
    "b^d": collapsed("b"),
    "b^c": collapsed("b"),
  },
  k: {
    KB: exact("KB"),
    "K^B": exact("KB"),
    kbr: exact("kbr"),
    Kbr: exact("kbr"),
    "k^br": exact("kbr"),
    ky: exact("ky"),
    "k^y": exact("ky"),
  },
  mc1r: {
    Em: exact("Em"),
    EM: exact("Em"),
    "E^m": exact("Em"),
    E: exact("E"),
    eA: exact("eA"),
    "e^A": exact("eA"),
    e: exact("e"),
    e1: exact("e"),
  },
  mitf: {
    N: exact("N"),
    S: exact("S"),
    sp: exact("S"),
    "s^p": exact("S"),
  },
  merle: {
    M: exact("M"),
    m: exact("m"),
  },
  fgf5: {
    L: exact("L"),
    l: exact("l"),
    N: exact("L"),
    S: exact("L"),
    L1: collapsed("l"),
    L2: collapsed("l"),
    L3: collapsed("l"),
    L4: collapsed("l"),
    L5: collapsed("l"),
  },
  intensity: {
    N: exact("N"),
    I: exact("N"),
    In: exact("In"),
    i: exact("In"),
  },
  slc45a2: {
    N: exact("N"),
    C: exact("N"),
    alb: exact("alb"),
    ca: exact("alb"),
    caL: exact("alb"),
    LAA: exact("alb"),
  },
  foxi3: {
    N: exact("N"),
    Dup: exact("Dup"),
    Hr: exact("Dup"),
  },
};

export function normalizeAllele(locus: LocusId, raw: string): AliasTarget | null {
  const table = ALLELE_ALIASES[locus];
  const key = raw.trim();
  return Object.hasOwn(table, key) ? (table[key] ?? null) : null;
}

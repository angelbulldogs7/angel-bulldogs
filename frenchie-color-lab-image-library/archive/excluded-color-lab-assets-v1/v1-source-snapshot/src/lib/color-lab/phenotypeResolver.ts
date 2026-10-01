import { isDiluteAllele, isFgf5Lof, isKrt71Curl, isLofTyrp1, LOCUS_IDS } from "../../data/color-lab/loci";
import {
  curlClass,
  eumelaninColor,
  isHairlessExpressed,
  nameFromTraits,
  type PatternClass,
} from "../../data/color-lab/phenotypeNames";
import { countAllele, genotypeSummary, hasAllele } from "./genotype";
import { flagsForDog } from "./safetyRules";
import type { AllelePair, Genotype, LocusExpression, LocusId, ProvenanceMap, ResolvedPhenotype } from "./types";

export interface PhenotypeState {
  asip: "dy" | "sy" | "bs" | "a";
  brown: boolean;
  cocoa: boolean;
  dilute: boolean;
  k: "KB" | "kbr" | "ky";
  cream: boolean;
  pied: boolean;
  merleCopies: 0 | 1 | 2;
  pink: boolean;
  fluffy: boolean;
  foxi3Copies: 0 | 1 | 2;
  curlCopies: 0 | 1 | 2;
  furnished: boolean;
  lightIntensity: boolean;
}

export function emptyPhenotypeState(): PhenotypeState {
  return {
    asip: "a",
    brown: false,
    cocoa: false,
    dilute: false,
    k: "ky",
    cream: false,
    pied: false,
    merleCopies: 0,
    pink: false,
    fluffy: false,
    foxi3Copies: 0,
    curlCopies: 0,
    furnished: false,
    lightIntensity: false,
  };
}

export function applyLocusToState(state: PhenotypeState, locusId: LocusId, pair: AllelePair): PhenotypeState {
  const next = { ...state };
  switch (locusId) {
    case "asip":
      next.asip = asipClassFromPair(pair);
      break;
    case "tyrp1":
      next.brown = isLofTyrp1(pair[0]) && isLofTyrp1(pair[1]);
      break;
    case "cocoa":
      next.cocoa = pair[0] === "co" && pair[1] === "co";
      break;
    case "dilute":
      next.dilute = isDiluteAllele(pair[0]) && isDiluteAllele(pair[1]);
      break;
    case "k":
      next.k = kClassFromPair(pair);
      break;
    case "mc1r":
      next.cream = pair[0] === "e" && pair[1] === "e";
      break;
    case "mitf":
      next.pied = hasAllele(pair, "S");
      break;
    case "merle":
      next.merleCopies = countAllele(pair, "M");
      break;
    case "intensity":
      next.lightIntensity = pair[0] === "i" && pair[1] === "i";
      break;
    case "slc45a2":
      next.pink = pair[0] === "ca" && pair[1] === "ca";
      break;
    case "fgf5":
      next.fluffy = isFgf5Lof(pair[0]) && isFgf5Lof(pair[1]);
      break;
    case "foxi3":
      next.foxi3Copies = countAllele(pair, "Dup");
      break;
    case "krt71":
      next.curlCopies = ((isKrt71Curl(pair[0]) ? 1 : 0) + (isKrt71Curl(pair[1]) ? 1 : 0)) as 0 | 1 | 2;
      break;
    case "rspo2":
      next.furnished = hasAllele(pair, "F");
      break;
    default:
      break;
  }
  return next;
}

export function stateKey(state: PhenotypeState): string {
  return [
    state.asip,
    state.brown ? 1 : 0,
    state.cocoa ? 1 : 0,
    state.dilute ? 1 : 0,
    state.k,
    state.cream ? 1 : 0,
    state.pied ? 1 : 0,
    state.merleCopies,
    state.pink ? 1 : 0,
    state.fluffy ? 1 : 0,
    state.foxi3Copies,
    state.curlCopies,
    state.furnished ? 1 : 0,
  ].join("|");
}

export function extractState(genotype: Genotype): PhenotypeState {
  let state = emptyPhenotypeState();
  for (const id of LOCUS_IDS) {
    state = applyLocusToState(state, id, genotype[id]);
  }
  state.lightIntensity = genotype.intensity[0] === "i" && genotype.intensity[1] === "i";
  return state;
}

function asipClassFromPair(pair: AllelePair): PhenotypeState["asip"] {
  if (hasAllele(pair, "dy")) return "dy";
  if (hasAllele(pair, "sy")) return "sy";
  if (hasAllele(pair, "bs")) return "bs";
  return "a";
}

function kClassFromPair(pair: AllelePair): PhenotypeState["k"] {
  if (hasAllele(pair, "KB")) return "KB";
  if (hasAllele(pair, "kbr")) return "kbr";
  return "ky";
}

function patternFromState(state: PhenotypeState): PatternClass {
  if (state.k === "KB") return "solid";
  if (state.k === "kbr") return "brindle";
  if (state.asip === "dy") return "fawn";
  if (state.asip === "sy") return "shaded-fawn";
  if (state.asip === "bs") return "tan-point";
  return "solid";
}

function curlFromState(state: PhenotypeState): "none" | "wavy" | "curly" {
  if (state.curlCopies >= 2) return "curly";
  if (state.curlCopies === 1) return "wavy";
  return "none";
}

/**
 * Ordered epistasis:
 * 1. FOXI3 Dup/Dup is nonviable (not a puppy phenotype).
 * 2. SLC45A2 Pink masks ordinary pigment.
 * 3. MC1R e/e cream masks coat eumelanin pattern.
 * 4. K locus, then ASIP, decide remaining pattern.
 * 5. TYRP1 brown and HPS3 cocoa stay independent, then MLPH dilution.
 * 6. Merle is visible on eumelanin only; hidden merle stays in the slug/genotype.
 * 7. Pied is a representative class with a variability caveat.
 * 8. Intensity is a caveat, not an exact shade name.
 * 9. Coat: hairless, then fluffy, curl, furnishings.
 */
export function resolveFromState(
  state: PhenotypeState,
  options: { genotype?: Genotype; provenance?: ProvenanceMap } = {},
): ResolvedPhenotype {
  const nonviable = state.foxi3Copies === 2;
  const pattern = patternFromState(state);
  const color = eumelaninColor(state.brown, state.cocoa, state.dilute);
  const merleVisible =
    !nonviable &&
    state.merleCopies > 0 &&
    !state.pink &&
    !state.cream &&
    pattern !== "fawn" &&
    pattern !== "shaded-fawn";
  const hairless = !nonviable && state.foxi3Copies === 1;
  const curl = curlFromState(state);

  const named = nameFromTraits({
    pink: state.pink && !nonviable,
    cream: state.cream,
    cocoa: state.cocoa,
    brown: state.brown,
    lightIntensity: state.lightIntensity,
    pattern,
    color,
    merleVisible,
    pied: state.pied,
    hairless,
    fluffy: state.fluffy,
    curl,
    furnished: state.furnished,
  });

  let slug = named.slug;
  if (state.merleCopies === 2 && merleVisible) {
    slug = slug.replace(/-merle$/, "-double-merle");
    if (!slug.includes("double-merle")) slug = `${slug}-double-merle`;
  } else if (state.merleCopies === 2 && !merleVisible && !nonviable) {
    slug = `${slug}-cryptic-double-merle`;
  } else if (state.merleCopies === 1 && !merleVisible && !nonviable) {
    slug = `${slug}-cryptic-merle`;
  }

  if (nonviable) {
    slug = `nonviable-foxi3-dup-dup${state.merleCopies === 2 ? "-double-merle" : ""}`;
  }

  const caveats = buildCaveats(state, merleVisible, pattern);
  const expressed = buildExpressed(state, pattern, merleVisible, hairless, curl, nonviable);
  const carried = options.genotype ? buildCarried(options.genotype, state, merleVisible, pattern) : [];
  const safetyFlags = options.genotype
    ? flagsForDog(options.genotype, options.provenance)
    : flagsFromState(state);

  return {
    slug,
    commonName: nonviable ? "Nonviable hairless conception" : named.commonName,
    breederTerm: nonviable ? false : named.breederTerm,
    scientificDescription: nonviable
      ? "FOXI3 Dup/Dup is treated as a presumed embryonic-lethal class, not a live puppy phenotype."
      : named.scientificDescription,
    genotypeSummary: options.genotype
      ? genotypeSummary(options.genotype)
      : "Multiple genotypes can produce this visible class. See the Genotypes tab for per-locus detail.",
    carriedTraits: carried,
    expressedTraits: expressed,
    caveats,
    imageId: named.slug,
    safetyFlags,
    nonviable,
    merleVisible,
    exampleGenotype: genotypeFromState(state),
  };
}

export function genotypeFromState(state: PhenotypeState): Genotype {
  return {
    asip: [state.asip, state.asip],
    tyrp1: state.brown ? ["bs", "bs"] : ["B", "B"],
    cocoa: state.cocoa ? ["co", "co"] : ["Co", "Co"],
    dilute: state.dilute ? ["d1", "d1"] : ["D", "D"],
    k: state.k === "KB" ? ["KB", "KB"] : state.k === "kbr" ? ["kbr", "kbr"] : ["ky", "ky"],
    mc1r: state.cream ? ["e", "e"] : ["Em", "Em"],
    mitf: state.pied ? ["S", "S"] : ["N", "N"],
    merle: state.merleCopies === 2 ? ["M", "M"] : state.merleCopies === 1 ? ["M", "m"] : ["m", "m"],
    intensity: state.lightIntensity ? ["i", "i"] : ["I", "I"],
    slc45a2: state.pink ? ["ca", "ca"] : ["C", "C"],
    fgf5: state.fluffy ? ["L4", "L4"] : ["N", "N"],
    foxi3: state.foxi3Copies === 2 ? ["Dup", "Dup"] : state.foxi3Copies === 1 ? ["N", "Dup"] : ["N", "N"],
    krt71: state.curlCopies === 2 ? ["C1", "C1"] : state.curlCopies === 1 ? ["N", "C1"] : ["N", "N"],
    rspo2: state.furnished ? ["F", "ic"] : ["ic", "ic"],
  };
}

export function resolvePhenotype(genotype: Genotype, provenance?: ProvenanceMap): ResolvedPhenotype {
  return resolveFromState(extractState(genotype), { genotype, provenance });
}

function flagsFromState(state: PhenotypeState) {
  return flagsForDog({
    asip: [state.asip, state.asip],
    tyrp1: state.brown ? ["bs", "bs"] : ["B", "B"],
    cocoa: state.cocoa ? ["co", "co"] : ["Co", "Co"],
    dilute: state.dilute ? ["d1", "d1"] : ["D", "D"],
    k: [state.k === "KB" ? "KB" : state.k === "kbr" ? "kbr" : "ky", "ky"],
    mc1r: state.cream ? ["e", "e"] : ["E", "E"],
    mitf: state.pied ? ["S", "S"] : ["N", "N"],
    merle: state.merleCopies === 2 ? ["M", "M"] : state.merleCopies === 1 ? ["M", "m"] : ["m", "m"],
    intensity: state.lightIntensity ? ["i", "i"] : ["I", "I"],
    slc45a2: state.pink ? ["ca", "ca"] : ["C", "C"],
    fgf5: state.fluffy ? ["L4", "L4"] : ["N", "N"],
    foxi3: state.foxi3Copies === 2 ? ["Dup", "Dup"] : state.foxi3Copies === 1 ? ["N", "Dup"] : ["N", "N"],
    krt71: state.curlCopies === 2 ? ["C1", "C1"] : state.curlCopies === 1 ? ["N", "C1"] : ["N", "N"],
    rspo2: state.furnished ? ["F", "ic"] : ["ic", "ic"],
  } as Genotype);
}

function buildCaveats(state: PhenotypeState, merleVisible: boolean, pattern: PatternClass): string[] {
  const caveats: string[] = [];
  if (state.pied) {
    caveats.push(
      "Pied/white spotting is a representative class. White extent cannot be predicted as an exact patch map from this genotype.",
    );
  }
  if (state.merleCopies > 0) {
    caveats.push(
      "Merle is simplified to M/m. Cryptic, atypical, harlequin, mosaic, and insertion-length merle are out of scope.",
    );
    if (!merleVisible && state.foxi3Copies < 2) {
      caveats.push("Merle is genetically present but not expected to show as a merle coat in this masked or pheomelanin-forward phenotype (hidden/cryptic merle).");
    }
  }
  if ((state.cream || pattern === "fawn" || pattern === "shaded-fawn" || pattern === "tan-point") && !state.pink) {
    caveats.push("MFSD12 intensity explains only part of cream-to-red variation. This tool does not assign an exact shade.");
  }
  if (state.dilute) {
    caveats.push("Known MLPH variants do not account for every dilute-appearing dog.");
  }
  if (state.asip === "dy" || state.asip === "sy") {
    caveats.push("DY and SY fawn haplotypes are often not visually distinguished in French Bulldogs.");
  }
  if (state.curlCopies > 0 && !state.fluffy && state.foxi3Copies === 0) {
    caveats.push("Curl is dosage-sensitive and may be subtle on a short coat.");
  }
  caveats.push(
    "The representative image does not predict exact markings, white coverage, merle layout, eye color, nose shade, intensity, or individual appearance.",
  );
  return caveats;
}

function buildExpressed(
  state: PhenotypeState,
  pattern: PatternClass,
  merleVisible: boolean,
  hairless: boolean,
  curl: "none" | "wavy" | "curly",
  nonviable: boolean,
): string[] {
  if (nonviable) return ["FOXI3 Dup/Dup presumed nonviable"];
  const items: string[] = [];
  if (state.pink) items.push("Pink / SLC45A2 albinism-associated phenotype");
  else if (state.cream) items.push("Recessive red/cream (MC1R e/e)");
  else {
    items.push(`Pattern: ${pattern.replace("-", " ")}`);
    items.push(`Eumelanin: ${eumelaninColor(state.brown, state.cocoa, state.dilute)}`);
  }
  if (merleVisible) items.push(state.merleCopies === 2 ? "Double merle (M/M)" : "Merle");
  if (state.pied) items.push("Pied / white spotting class");
  if (hairless) items.push("Hairless (FOXI3 N/Dup)");
  else {
    if (state.fluffy) items.push("Long coat / fluffy (FGF5)");
    if (curl === "curly") items.push("Curly coat (KRT71)");
    else if (curl === "wavy") items.push("Wavy coat influence (KRT71)");
    if (state.furnished) items.push("Furnishings (RSPO2)");
  }
  return items;
}

function buildCarried(
  genotype: Genotype,
  state: PhenotypeState,
  merleVisible: boolean,
  pattern: PatternClass,
): string[] {
  const items: string[] = [];
  if (!state.brown && (isLofTyrp1(genotype.tyrp1[0]) || isLofTyrp1(genotype.tyrp1[1]))) {
    items.push("Chocolate/brown (TYRP1) — carried");
  }
  if (!state.cocoa && hasAllele(genotype.cocoa, "co")) items.push("Cocoa (HPS3) — carried");
  if (!state.dilute && (isDiluteAllele(genotype.dilute[0]) || isDiluteAllele(genotype.dilute[1]))) {
    items.push("Dilution (MLPH) — carried");
  }
  if (!state.cream && hasAllele(genotype.mc1r, "e")) items.push("Cream (MC1R e) — carried");
  if (!state.pink && hasAllele(genotype.slc45a2, "ca")) items.push("Pink (SLC45A2) — carried");
  if (!state.fluffy && (isFgf5Lof(genotype.fgf5[0]) || isFgf5Lof(genotype.fgf5[1]))) {
    items.push("Fluffy/long coat (FGF5) — carried");
  }
  if (state.k === "KB" && hasAllele(genotype.k, "kbr")) items.push("Brindle (kbr) — masked by KB");
  if (state.k === "KB" && (state.asip === "dy" || state.asip === "sy" || state.asip === "bs")) {
    items.push(`ASIP ${state.asip.toUpperCase()} pattern — masked by KB`);
  }
  if (state.cream && pattern !== "solid") {
    items.push("Eumelanin pattern is masked in the coat by e/e; it remains in the genotype");
  }
  if (state.pink) {
    items.push("Ordinary pigment loci remain in the genotype under Pink masking");
  }
  if (state.merleCopies > 0 && !merleVisible) items.push("Merle — hidden in this visible phenotype");
  if (hasAllele(genotype.krt71, "C1") || hasAllele(genotype.krt71, "C2")) {
    if (curlClass(genotype) === "none") items.push("Curl (KRT71) — present");
  }
  if (!isHairlessExpressed(genotype) && hasAllele(genotype.foxi3, "Dup")) {
    items.push("Hairless duplication — carried");
  }
  return items;
}

export function locusExpression(locusId: LocusId, pair: AllelePair): LocusExpression {
  switch (locusId) {
    case "tyrp1":
      if (isLofTyrp1(pair[0]) && isLofTyrp1(pair[1])) return "expressed";
      if (isLofTyrp1(pair[0]) || isLofTyrp1(pair[1])) return "carried";
      return "clear";
    case "cocoa":
      if (pair[0] === "co" && pair[1] === "co") return "expressed";
      if (hasAllele(pair, "co")) return "carried";
      return "clear";
    case "dilute":
      if (isDiluteAllele(pair[0]) && isDiluteAllele(pair[1])) return "expressed";
      if (isDiluteAllele(pair[0]) || isDiluteAllele(pair[1])) return "carried";
      return "clear";
    case "k":
      if (hasAllele(pair, "KB") || hasAllele(pair, "kbr")) return "expressed";
      return "clear";
    case "mc1r":
      if (pair[0] === "e" && pair[1] === "e") return "expressed";
      if (hasAllele(pair, "e") || hasAllele(pair, "Em")) return hasAllele(pair, "Em") ? "expressed" : "carried";
      return "clear";
    case "mitf":
      return hasAllele(pair, "S") ? "expressed" : "clear";
    case "merle":
      return hasAllele(pair, "M") ? "expressed" : "clear";
    case "intensity":
      if (pair[0] === "i" && pair[1] === "i") return "expressed";
      if (hasAllele(pair, "i")) return "carried";
      return "clear";
    case "slc45a2":
      if (pair[0] === "ca" && pair[1] === "ca") return "expressed";
      if (hasAllele(pair, "ca")) return "carried";
      return "clear";
    case "fgf5":
      if (isFgf5Lof(pair[0]) && isFgf5Lof(pair[1])) return "expressed";
      if (isFgf5Lof(pair[0]) || isFgf5Lof(pair[1])) return "carried";
      return "clear";
    case "foxi3":
      if (pair[0] === "Dup" && pair[1] === "Dup") return "nonviable";
      if (hasAllele(pair, "Dup")) return "expressed";
      return "clear";
    case "krt71":
      return isKrt71Curl(pair[0]) || isKrt71Curl(pair[1]) ? "expressed" : "clear";
    case "rspo2":
      return hasAllele(pair, "F") ? "expressed" : "clear";
    case "asip":
      return "expressed";
    default:
      return "clear";
  }
}

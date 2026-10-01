import { countAllele, hasAllele } from "./genotype";
import type { Genotype, ProvenanceMap, SafetyFlag } from "./types";

export function canContributeMerle(genotype: Genotype): boolean {
  return hasAllele(genotype.merle, "M");
}

export function canContributeHairless(genotype: Genotype): boolean {
  return hasAllele(genotype.foxi3, "Dup");
}

export function flagsForDog(genotype: Genotype, provenance?: ProvenanceMap): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (countAllele(genotype.merle, "M") === 2) {
    flags.push({
      code: "double-merle",
      severity: "critical",
      message:
        "M/M (double merle) is associated with a higher risk of hearing and eye abnormalities. This is a genetically concerning outcome, not a hidden result.",
    });
  }
  if (countAllele(genotype.merle, "M") >= 1) {
    flags.push({
      code: "simplified-merle-model",
      severity: "info",
      message:
        "Merle is modeled only as M versus m. Cryptic, atypical, harlequin, mosaic, and insertion-length merle are not represented.",
    });
  }
  if (genotype.foxi3[0] === "Dup" && genotype.foxi3[1] === "Dup") {
    flags.push({
      code: "hairless-lethal",
      severity: "critical",
      message:
        "FOXI3 Dup/Dup is treated as a presumed embryonic-lethal conception class, not as a puppy that can be born.",
    });
  }
  if (provenance && Object.values(provenance).some((item) => item === "assumed")) {
    flags.push({
      code: "assumed-wild-type",
      severity: "info",
      message:
        "Some loci are assumed defaults for this tool, not laboratory-confirmed DNA results.",
    });
  }
  return flags;
}

export function flagsForPairing(sire: Genotype, dam: Genotype): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  if (canContributeMerle(sire) && canContributeMerle(dam)) {
    flags.push({
      code: "merle-merle-pairing",
      severity: "critical",
      message:
        "Both parents can pass merle (M). About 25% of conceptions from two M/m parents are expected to be M/M. Double-merle dogs have increased risk of auditory and ophthalmologic abnormalities. The calculation is not blocked.",
    });
  }
  if (canContributeHairless(sire) && canContributeHairless(dam)) {
    flags.push({
      code: "hairless-hairless-pairing",
      severity: "critical",
      message:
        "Both parents carry the FOXI3 hairless duplication. Dup/Dup conceptions are counted separately as presumed nonviable and are never shown as a live puppy card.",
    });
  }
  return flags;
}

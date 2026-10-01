import type {
  AcknowledgementCode,
  Genotype,
  InterestEligibility,
  NoticeCode,
  PhenotypeResult,
} from "./types";
import { requireOption } from "./genotype";

export type NoticeSeverity = "info" | "warning" | "critical";

export interface NoticeDefinition {
  readonly severity: NoticeSeverity;
  readonly title: string;
  readonly text: string;
}

export const NOTICES: Readonly<Record<NoticeCode, NoticeDefinition>> = {
  "double-merle": {
    severity: "critical",
    title: "Double Merle (M/M)",
    text: "UC Davis VGL notes that double merle dogs may have auditory, ophthalmologic, skeletal, and other defects. Double Merle results are not offered for puppy interest.",
  },
  "merle-simplified": {
    severity: "info",
    title: "Simplified Merle",
    text: "Merle is modeled only as m/m, M/m, and M/M. Cryptic, atypical, mosaic, harlequin, and insertion-length results are not modeled.",
  },
  "pied-variable": {
    severity: "info",
    title: "Pied varies",
    text: "Exact white coverage and patch placement are not predicted.",
  },
  "hairless-dentition": {
    severity: "warning",
    title: "Hairless health notice",
    text: "Hairlessness from the FOXI3 duplication (N/Dup) is associated with canine ectodermal dysplasia, including missing and abnormally shaped teeth.",
  },
  "pink-albinism": {
    severity: "warning",
    title: "Pink / albinism notice",
    text: "Pink is SLC45A2 oculocutaneous albinism: a white to off-white coat with little or no pigment in the skin, nose, and eyes.",
  },
  "intensity-dilution": {
    severity: "info",
    title: "Intensity Dilution",
    text: "In/In lightens red or yellow pigment toward cream or white. Black and brown pigment are not lightened, and the degree of dilution varies.",
  },
  "nonviable-dup-dup": {
    severity: "critical",
    title: "Nonviable at conception",
    text: "FOXI3 Dup/Dup is treated as nonviable at conception. It is never shown as a puppy.",
  },
  "big-rope-visual": {
    severity: "info",
    title: "Big Rope is visual only",
    text: "Big Rope is a visual/conformation preference, not a DNA result.",
  },
};

export const ACKNOWLEDGEMENTS: Readonly<Record<AcknowledgementCode, { readonly label: string }>> = {
  hairless: {
    label:
      "I understand Hairless (FOXI3 N/Dup) is associated with ectodermal dysplasia and abnormal teeth. This acknowledgement is not veterinary clearance.",
  },
  pink: {
    label:
      "I understand Pink is SLC45A2 albinism with little pigment in the skin, nose, and eyes. This acknowledgement is not veterinary clearance.",
  },
};

export const GENERAL_QUALIFICATION =
  "Results are educational per-conception probability estimates. They are not a guarantee of litter composition, exact appearance, health, or availability, and they are not veterinary or breeding advice.";

export type PairingWarningCode = "merle-pairing" | "hairless-pairing";

export interface PairingWarning {
  readonly code: PairingWarningCode;
  readonly title: string;
  readonly text: string;
}

function contributes(locus: "merle" | "foxi3", genotype: Genotype, allele: string): boolean {
  return requireOption(locus, genotype[locus]).alleles.includes(allele);
}

export function canContributeMerle(genotype: Genotype): boolean {
  return contributes("merle", genotype, "M");
}

export function canContributeHairless(genotype: Genotype): boolean {
  return contributes("foxi3", genotype, "Dup");
}

/** Shown before calculation. The math still runs; nothing is renormalized away. */
export function pairingWarnings(stud: Genotype, dam: Genotype): PairingWarning[] {
  const warnings: PairingWarning[] = [];
  if (canContributeMerle(stud) && canContributeMerle(dam)) {
    warnings.push({
      code: "merle-pairing",
      title: "Both parents can pass Merle (M)",
      text: "This pairing can produce Double Merle (M/M) puppies, which have an increased risk of hearing and eye problems. The calculation still shows the exact M/M chance.",
    });
  }
  if (canContributeHairless(stud) && canContributeHairless(dam)) {
    warnings.push({
      code: "hairless-pairing",
      title: "Both parents can pass Hairless (Dup)",
      text: "This pairing can produce FOXI3 Dup/Dup conceptions, which are nonviable. They are counted at conception and listed in the Genotypes tab, never as puppies.",
    });
  }
  return warnings;
}

export function interestEligibility(result: PhenotypeResult): InterestEligibility {
  if (result.kind === "nonviable") return { eligible: false, reason: "nonviable" };
  if (result.kind === "concerning") return { eligible: false, reason: "double-merle" };
  const acknowledgements: AcknowledgementCode[] = [];
  if (result.tokens.hairless) acknowledgements.push("hairless");
  if (result.coat === "pink") acknowledgements.push("pink");
  return { eligible: true, acknowledgements };
}

export function missingAcknowledgements(
  eligibility: InterestEligibility,
  acknowledged: readonly AcknowledgementCode[],
): AcknowledgementCode[] {
  if (!eligibility.eligible) return [];
  return eligibility.acknowledgements.filter((code) => !acknowledged.includes(code));
}

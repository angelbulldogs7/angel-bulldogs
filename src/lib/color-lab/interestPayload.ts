import { COLOR_LAB_ASSET_LIBRARY_VERSION } from "../../data/color-lab/visualRegistry";
import { carrierSentences, maskedTraitSentences } from "./hiddenDna";
import { displayGenotype, requireOption } from "./genotype";
import type { PhenotypeGroup } from "./inheritance";
import { resolveDog } from "./phenotypeResolver";
import { formatFraction } from "./probabilityFormatting";
import type {
  AcknowledgementCode,
  Confirmation,
  DogSex,
  DogState,
  LocusId,
  NoticeCode,
  ViablePhenotype,
} from "./types";
import { COLOR_LAB_RULESET_VERSION, COLOR_LAB_SCHEMA_VERSION, LOCUS_IDS } from "./types";
import { visibleSignature, visualIdFor, visualSlug } from "./visualRecipe";

export const INTEREST_PAYLOAD_VERSION = 2;

export interface InterestVisitor {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly city: string;
  readonly state: string;
  readonly timeframe: string;
}

export interface GenotypeEntry {
  readonly option: string;
  readonly display: string;
  readonly label: string;
}

export interface CalculatedGenotypeEntry extends GenotypeEntry {
  /** Share of puppies in this phenotype group with this genotype. */
  readonly withinPhenotype: string;
}

export interface ParentInput {
  readonly name: string;
  readonly sex: DogSex;
  readonly state: DogState;
}

export interface ParentSnapshot {
  readonly name: string;
  readonly sex: DogSex;
  readonly publicName: string;
  readonly genotype: Readonly<Record<LocusId, GenotypeEntry>>;
  readonly confirmation: Confirmation;
  readonly bigRope: boolean;
}

export type InterestContext =
  | {
      readonly source: "build";
      readonly state: DogState;
      readonly result: ViablePhenotype;
    }
  | {
      readonly source: "breeding";
      readonly group: PhenotypeGroup;
      /** The group's representative, re-resolved when the Big Rope preview is on. */
      readonly result: ViablePhenotype;
      readonly bigRopePreview: boolean;
      readonly stud: ParentInput;
      readonly dam: ParentInput;
      readonly nonviablePercent: string | null;
    };

export interface InterestPayload {
  readonly payloadVersion: typeof INTEREST_PAYLOAD_VERSION;
  readonly schemaVersion: typeof COLOR_LAB_SCHEMA_VERSION;
  readonly rulesetVersion: string;
  readonly assetLibraryVersion: string;
  readonly source: "build" | "breeding";
  readonly submittedAt: string;
  readonly visitor: InterestVisitor;
  readonly puppy: {
    readonly publicName: string;
    readonly subtitle: string | null;
    readonly aliases: readonly string[];
    readonly visualId: string;
    readonly visualSlug: string;
    readonly visibleSignature: string;
    readonly genotype:
      | { readonly kind: "selected"; readonly loci: Readonly<Record<LocusId, GenotypeEntry>> }
      | { readonly kind: "calculated"; readonly loci: Readonly<Record<LocusId, readonly CalculatedGenotypeEntry[]>> };
    readonly hiddenDna: readonly string[];
    readonly confirmation: Confirmation | "calculated";
    readonly probability: {
      readonly perConception: string;
      readonly exact: string;
      readonly denominator: string;
      readonly viableOnly: { readonly percent: string; readonly denominator: string } | null;
    } | null;
    readonly bigRope: {
      readonly selected: boolean;
      readonly basis: "visual preference" | "manual preview";
      readonly geneticChance: "Unknown — not genetically calculated";
    };
    readonly notices: readonly NoticeCode[];
    readonly acknowledgements: Readonly<Record<AcknowledgementCode, boolean>>;
  };
  readonly stud: ParentSnapshot | null;
  readonly dam: ParentSnapshot | null;
}

function selectedGenotype(state: DogState): Record<LocusId, GenotypeEntry> {
  const loci = {} as Record<LocusId, GenotypeEntry>;
  for (const locus of LOCUS_IDS) {
    const option = requireOption(locus, state.genotype[locus]);
    loci[locus] = { option: option.id, display: displayGenotype(locus, option.id), label: option.label };
  }
  return loci;
}

export function parentSnapshot(parent: ParentInput): ParentSnapshot {
  return {
    name: parent.name,
    sex: parent.sex,
    publicName: resolveDog(parent.state).publicName,
    genotype: selectedGenotype(parent.state),
    confirmation: parent.state.confirmation,
    bigRope: parent.state.bigRope,
  };
}

export function buildInterestPayload(
  context: InterestContext,
  visitor: InterestVisitor,
  acknowledged: readonly AcknowledgementCode[],
  now: Date = new Date(),
): InterestPayload {
  const result = context.result;
  const signature = visibleSignature(result.recipe);
  const acknowledgements = {
    hairless: acknowledged.includes("hairless"),
    pink: acknowledged.includes("pink"),
  };
  const shared = {
    payloadVersion: INTEREST_PAYLOAD_VERSION,
    schemaVersion: COLOR_LAB_SCHEMA_VERSION,
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    assetLibraryVersion: COLOR_LAB_ASSET_LIBRARY_VERSION,
    submittedAt: now.toISOString(),
    visitor,
  } as const;
  const identity = {
    publicName: result.publicName,
    subtitle: result.subtitle,
    aliases: result.aliases,
    visualId: visualIdFor(signature),
    visualSlug: visualSlug(result.recipe),
    visibleSignature: signature,
    notices: result.notices,
    acknowledgements,
  };

  if (context.source === "build") {
    return {
      ...shared,
      source: "build",
      puppy: {
        ...identity,
        genotype: { kind: "selected", loci: selectedGenotype(context.state) },
        hiddenDna: [...carrierSentences(context.state.genotype), ...maskedTraitSentences(result.masked)],
        confirmation: context.state.confirmation,
        probability: null,
        bigRope: {
          selected: context.state.bigRope,
          basis: "visual preference",
          geneticChance: "Unknown — not genetically calculated",
        },
      },
      stud: null,
      dam: null,
    };
  }

  const group = context.group;
  const calculated = {} as Record<LocusId, CalculatedGenotypeEntry[]>;
  for (const locus of LOCUS_IDS) {
    calculated[locus] = group.possibleGenotypes[locus].map((item) => ({
      option: item.option,
      display: item.display,
      label: item.label,
      withinPhenotype: item.percentWithinGroup,
    }));
  }
  return {
    ...shared,
    source: "breeding",
    puppy: {
      ...identity,
      genotype: { kind: "calculated", loci: calculated },
      hiddenDna: maskedTraitSentences(group.masked),
      confirmation: "calculated",
      probability: {
        perConception: group.percent,
        exact: formatFraction(group.exact),
        denominator: "All conceptions from this pairing, including any nonviable FOXI3 Dup/Dup conceptions",
        viableOnly:
          group.viablePercent && context.nonviablePercent
            ? {
                percent: group.viablePercent,
                denominator: `Potentially viable conceptions only (excludes ${context.nonviablePercent}% FOXI3 Dup/Dup)`,
              }
            : null,
      },
      bigRope: {
        selected: context.bigRopePreview,
        basis: "manual preview",
        geneticChance: "Unknown — not genetically calculated",
      },
    },
    stud: parentSnapshot(context.stud),
    dam: parentSnapshot(context.dam),
  };
}

function genotypeLine(loci: Readonly<Record<LocusId, GenotypeEntry>>): string {
  return LOCUS_IDS.map((locus) => loci[locus].display).join(" · ");
}

export function formatInterestSummary(payload: InterestPayload): string {
  const puppy = payload.puppy;
  const lines = [
    `Source: ${payload.source === "build" ? "Build a Frenchie" : "Breeding Calculator"}`,
    `Phenotype: ${puppy.publicName}${puppy.subtitle ? ` (${puppy.subtitle})` : ""}`,
    `Visual ID: ${puppy.visualId} (${puppy.visualSlug})`,
    `DNA status: ${puppy.confirmation}`,
  ];
  if (puppy.genotype.kind === "selected") {
    lines.push(`Genotype: ${genotypeLine(puppy.genotype.loci)}`);
  } else {
    const calculatedLoci = puppy.genotype.loci;
    lines.push(
      `Possible genotypes: ${LOCUS_IDS.map((locus) =>
        calculatedLoci[locus].map((item) => `${item.display} ${item.withinPhenotype}%`).join(" / "),
      ).join(" · ")}`,
    );
  }
  if (puppy.probability) {
    lines.push(`Probability: ${puppy.probability.perConception}% per conception (${puppy.probability.exact})`);
    if (puppy.probability.viableOnly) {
      lines.push(`Among potentially viable puppies: ${puppy.probability.viableOnly.percent}%`);
    }
  }
  lines.push(`Big Rope: ${puppy.bigRope.selected ? "On" : "Off"} (${puppy.bigRope.basis}; chance ${puppy.bigRope.geneticChance})`);
  if (puppy.hiddenDna.length > 0) lines.push(`Hidden DNA: ${puppy.hiddenDna.join(" ")}`);
  if (puppy.notices.length > 0) lines.push(`Notices: ${puppy.notices.join(", ")}`);
  lines.push(
    `Acknowledged: hairless=${puppy.acknowledgements.hairless ? "yes" : "no"}, pink=${puppy.acknowledgements.pink ? "yes" : "no"}`,
  );
  for (const [label, parent] of [
    ["Stud", payload.stud],
    ["Dam", payload.dam],
  ] as const) {
    if (!parent) continue;
    lines.push(
      `${label}: ${parent.name} (${parent.sex}) · ${parent.publicName} · ${parent.confirmation} · Big Rope ${parent.bigRope ? "On" : "Off"}`,
    );
    lines.push(`${label} genotype: ${genotypeLine(parent.genotype)}`);
  }
  lines.push(`Visitor: ${payload.visitor.fullName} · ${payload.visitor.email} · ${payload.visitor.phone}`);
  lines.push(`Location: ${payload.visitor.city}, ${payload.visitor.state}`);
  lines.push(`Timeframe: ${payload.visitor.timeframe}`);
  lines.push(`Ruleset ${payload.rulesetVersion} · schema ${payload.schemaVersion} · assets ${payload.assetLibraryVersion}`);
  return lines.join("\n");
}

/** Flat fields for Formspree: readable summary plus the structured JSON payload. */
export function toFormspreeBody(payload: InterestPayload): Record<string, string> {
  return {
    name: payload.visitor.fullName,
    email: payload.visitor.email,
    phone: payload.visitor.phone,
    city: payload.visitor.city,
    state: payload.visitor.state,
    timeframe: payload.visitor.timeframe,
    _subject: `Color Lab interest: ${payload.puppy.publicName}`,
    message: formatInterestSummary(payload),
    source: payload.source,
    phenotype: payload.puppy.publicName,
    visualId: payload.puppy.visualId,
    rulesetVersion: payload.rulesetVersion,
    payload: JSON.stringify(payload),
  };
}

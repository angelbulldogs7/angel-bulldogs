import { COLOR_LAB_RULESET_VERSION, COLOR_LAB_SCHEMA_VERSION } from "./types";
import type {
  DogSnapshot,
  Genotype,
  InterestPayload,
  InterestSource,
  InterestVisitor,
  ProvenanceMap,
  ResolvedPhenotype,
} from "./types";

export interface InterestContext {
  source: InterestSource;
  visitor: InterestVisitor;
  phenotype: ResolvedPhenotype;
  genotype: Genotype;
  provenance: ProvenanceMap;
  probability: string | null;
  stud: DogSnapshot | null;
  dam: DogSnapshot | null;
  now?: Date;
}

export function buildInterestPayload(context: InterestContext): InterestPayload {
  return {
    schemaVersion: COLOR_LAB_SCHEMA_VERSION,
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    source: context.source,
    submittedAt: (context.now ?? new Date()).toISOString(),
    visitor: context.visitor,
    puppy: {
      commonName: context.phenotype.commonName,
      scientificDescription: context.phenotype.scientificDescription,
      slug: context.phenotype.slug,
      imageId: context.phenotype.imageId,
      genotype: context.genotype,
      provenance: context.provenance,
      expressedTraits: context.phenotype.expressedTraits,
      carriedTraits: context.phenotype.carriedTraits,
      caveats: context.phenotype.caveats,
      safetyFlags: context.phenotype.safetyFlags,
      probability: context.probability,
    },
    stud: context.stud,
    dam: context.dam,
  };
}

export function formatInterestSummary(payload: InterestPayload): string {
  const lines = [
    `Source: ${payload.source === "build" ? "Build a Frenchie" : "Breeding Calculator"}`,
    `Ruleset: ${payload.rulesetVersion}`,
    `Phenotype: ${payload.puppy.commonName}`,
    `Slug: ${payload.puppy.slug}`,
    `Scientific: ${payload.puppy.scientificDescription}`,
    payload.puppy.probability ? `Probability: ${payload.puppy.probability}%` : "Probability: n/a (builder)",
    `Genotype: ${JSON.stringify(payload.puppy.genotype)}`,
    `Provenance: ${JSON.stringify(payload.puppy.provenance)}`,
    `Expressed: ${payload.puppy.expressedTraits.join("; ") || "—"}`,
    `Carried: ${payload.puppy.carriedTraits.join("; ") || "—"}`,
    `Caveats: ${payload.puppy.caveats.join("; ") || "—"}`,
    `Flags: ${payload.puppy.safetyFlags.map((flag) => flag.code).join(", ") || "—"}`,
  ];
  if (payload.stud) {
    lines.push(`Stud: ${payload.stud.name} (${payload.stud.sex}) · ${payload.stud.phenotypeName}`);
    lines.push(`Stud genotype: ${JSON.stringify(payload.stud.genotype)}`);
  }
  if (payload.dam) {
    lines.push(`Dam: ${payload.dam.name} (${payload.dam.sex}) · ${payload.dam.phenotypeName}`);
    lines.push(`Dam genotype: ${JSON.stringify(payload.dam.genotype)}`);
  }
  lines.push(`Visitor: ${payload.visitor.fullName}, ${payload.visitor.email}, ${payload.visitor.phone}`);
  lines.push(`Location: ${payload.visitor.city}, ${payload.visitor.state}`);
  lines.push(`Timeframe: ${payload.visitor.timeframe}`);
  return lines.join("\n");
}

export function toFormspreeBody(payload: InterestPayload): Record<string, string> {
  return {
    name: payload.visitor.fullName,
    email: payload.visitor.email,
    phone: payload.visitor.phone,
    city: payload.visitor.city,
    state: payload.visitor.state,
    timeframe: payload.visitor.timeframe,
    _subject: `Color Lab interest: ${payload.puppy.commonName}`,
    summary: formatInterestSummary(payload),
    payload: JSON.stringify(payload),
    source: payload.source,
    phenotype: payload.puppy.commonName,
    slug: payload.puppy.slug,
    rulesetVersion: payload.rulesetVersion,
  };
}

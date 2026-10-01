import { normalizeAllele } from "../../data/color-lab/alleleAliases";
import { getLocus } from "../../data/color-lab/loci";
import { alleleRank, isSelectableOption } from "./genotype";
import { resolvePhenotype } from "./phenotypeResolver";
import type { Confirmation, Genotype, LocusId, SavedDog } from "./types";
import { COLOR_LAB_RULESET_VERSION, COLOR_LAB_SCHEMA_VERSION, LOCUS_IDS } from "./types";
import { boundedString, isRecord, parseConfirmation, parseSex, sanitizeDogName } from "./validation";
import { visibleSignature, visualIdFor } from "./visualRecipe";

export type LocusMigrationOutcome = "exact" | "collapsed" | "fallback";

export interface MigrationReport {
  readonly sourceVersion: 1 | 2;
  readonly loci: Readonly<Record<LocusId, LocusMigrationOutcome>>;
  readonly discardedFields: readonly string[];
  readonly confirmationBefore: Confirmation | "none";
  readonly confirmationAfter: Confirmation;
}

export interface MigrationResult {
  readonly dog: SavedDog;
  readonly report: MigrationReport;
}

const KNOWN_FIELDS = new Set([
  "schemaVersion",
  "rulesetVersion",
  "id",
  "name",
  "sex",
  "genotype",
  "bigRope",
  "confirmation",
  "phenotype",
  "notices",
  "createdAt",
  "updatedAt",
]);

function normalizePair(
  locus: LocusId,
  rawA: unknown,
  rawB: unknown,
): { option: string; fidelity: "exact" | "collapsed" } | null {
  if (typeof rawA !== "string" || typeof rawB !== "string") return null;
  const a = normalizeAllele(locus, rawA);
  const b = normalizeAllele(locus, rawB);
  if (!a || !b) return null;
  const [first, second] =
    alleleRank(locus, a.allele) <= alleleRank(locus, b.allele) ? [a.allele, b.allele] : [b.allele, a.allele];
  const option = `${first}/${second}`;
  // Dup/Dup is not a living dog, so it cannot migrate into a saved Stud or Dam.
  if (!isSelectableOption(locus, option)) return null;
  return { option, fidelity: a.fidelity === "exact" && b.fidelity === "exact" ? "exact" : "collapsed" };
}

function readLocus(
  locus: LocusId,
  value: unknown,
): { option: string; outcome: LocusMigrationOutcome } {
  if (typeof value === "string") {
    if (isSelectableOption(locus, value)) return { option: value, outcome: "exact" };
    const parts = value.split("/");
    if (parts.length === 2) {
      const normalized = normalizePair(locus, parts[0], parts[1]);
      if (normalized) return { option: normalized.option, outcome: normalized.fidelity };
    }
  } else if (Array.isArray(value) && value.length === 2) {
    const normalized = normalizePair(locus, value[0], value[1]);
    if (normalized) return { option: normalized.option, outcome: normalized.fidelity };
  }
  return { option: getLocus(locus).baseline, outcome: "fallback" };
}

function migrateGenotype(raw: unknown): {
  genotype: Genotype;
  loci: Record<LocusId, LocusMigrationOutcome>;
  discarded: string[];
} {
  const source = isRecord(raw) ? raw : {};
  const genotype = {} as Record<LocusId, string>;
  const loci = {} as Record<LocusId, LocusMigrationOutcome>;
  for (const locus of LOCUS_IDS) {
    const { option, outcome } = readLocus(locus, source[locus]);
    genotype[locus] = option;
    loci[locus] = outcome;
  }
  const active = new Set<string>(LOCUS_IDS);
  const discarded = Object.keys(source)
    .filter((key) => !active.has(key))
    .map((key) => `genotype.${key}`);
  return { genotype, loci, discarded };
}

/**
 * Reads a saved record of any supported version into the current schema.
 * Removed fields are discarded silently. Lab-confirmed survives only when every active locus
 * maps exactly; v1 never stored a laboratory attestation, so v1 dogs migrate as Assumed.
 */
export function migrateSavedDog(raw: unknown, now: string): MigrationResult | null {
  if (!isRecord(raw)) return null;
  const version = raw.schemaVersion;
  if (version !== 1 && version !== COLOR_LAB_SCHEMA_VERSION) return null;

  const id = boundedString(raw.id, 80);
  const name = sanitizeDogName(raw.name);
  const sex = parseSex(raw.sex);
  if (!id || !name || !sex) return null;

  const { genotype, loci, discarded } = migrateGenotype(raw.genotype);
  const bigRope = raw.bigRope === true;
  const allExact = LOCUS_IDS.every((locus) => loci[locus] === "exact");

  const confirmationBefore: Confirmation | "none" =
    version === 1 ? "none" : (parseConfirmation(raw.confirmation) ?? "assumed");
  const confirmationAfter: Confirmation =
    confirmationBefore === "lab-confirmed" && allExact ? "lab-confirmed" : "assumed";

  // v1 per-locus "provenance" meant "user-entered", never a lab report, so it is dropped too.
  const discardedFields = [...Object.keys(raw).filter((key) => !KNOWN_FIELDS.has(key)), ...discarded];

  const createdAt = boundedString(raw.createdAt, 40) ?? now;
  const updatedAt = boundedString(raw.updatedAt, 40) ?? now;

  return {
    dog: buildSavedDog({ id, name, sex, genotype, bigRope, confirmation: confirmationAfter, createdAt, updatedAt }),
    report: {
      sourceVersion: version === 1 ? 1 : 2,
      loci,
      discardedFields,
      confirmationBefore,
      confirmationAfter,
    },
  };
}

export function buildSavedDog(input: {
  id: string;
  name: string;
  sex: SavedDog["sex"];
  genotype: Genotype;
  bigRope: boolean;
  confirmation: Confirmation;
  createdAt: string;
  updatedAt: string;
}): SavedDog {
  const result = resolvePhenotype(input.genotype, { bigRope: input.bigRope });
  if (result.kind === "nonviable") throw new Error("A nonviable genotype cannot be saved as a dog.");
  const signature = visibleSignature(result.recipe);
  return {
    schemaVersion: COLOR_LAB_SCHEMA_VERSION,
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    id: input.id,
    name: input.name,
    sex: input.sex,
    genotype: input.genotype,
    bigRope: input.bigRope,
    confirmation: input.confirmation,
    phenotype: {
      publicName: result.publicName,
      kind: result.kind,
      visualId: visualIdFor(signature),
      visibleSignature: signature,
    },
    notices: result.notices,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

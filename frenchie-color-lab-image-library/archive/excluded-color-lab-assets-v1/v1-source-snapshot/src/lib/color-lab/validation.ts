import { LOCI, LOCUS_IDS, getLocus } from "../../data/color-lab/loci";
import { canonicalizePair } from "./genotype";
import {
  COLOR_LAB_SCHEMA_VERSION,
  type AllelePair,
  type DogRecord,
  type DogSex,
  type Genotype,
  type LocusId,
  type ProvenanceMap,
} from "./types";

export function isAlleleOf(locusId: LocusId, alleleId: string): boolean {
  return getLocus(locusId).alleles.some((allele) => allele.id === alleleId);
}

export function isValidPair(locusId: LocusId, a: string, b: string): boolean {
  return isAlleleOf(locusId, a) && isAlleleOf(locusId, b);
}

export function parseAllelePair(locusId: LocusId, value: unknown): AllelePair | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const a = value[0];
  const b = value[1];
  if (typeof a !== "string" || typeof b !== "string") return null;
  if (!isValidPair(locusId, a, b)) return null;
  return canonicalizePair(locusId, a, b);
}

export function parseGenotype(value: unknown): Genotype | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const genotype = {} as Genotype;
  for (const locus of LOCI) {
    const pair = parseAllelePair(locus.id, record[locus.id]);
    if (!pair) return null;
    genotype[locus.id] = pair;
  }
  return genotype;
}

export function parseProvenance(value: unknown): ProvenanceMap | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const map = {} as ProvenanceMap;
  for (const id of LOCUS_IDS) {
    const item = record[id];
    if (item !== "assumed" && item !== "confirmed") return null;
    map[id] = item;
  }
  return map;
}

export function parseSex(value: unknown): DogSex | null {
  if (value === "male" || value === "female") return value;
  return null;
}

function isPlainString(value: unknown, max = 120): value is string {
  return typeof value === "string" && value.length <= max;
}

/** Visitor-provided names are stored as text only — never interpreted as HTML. */
export function sanitizeDogName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function parseDogRecord(value: unknown): DogRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== COLOR_LAB_SCHEMA_VERSION) return null;
  if (!isPlainString(record.rulesetVersion, 32)) return null;
  if (!isPlainString(record.id, 80)) return null;
  const name = sanitizeDogName(record.name);
  if (!name) return null;
  const sex = parseSex(record.sex);
  const genotype = parseGenotype(record.genotype);
  const provenance = parseProvenance(record.provenance);
  if (!sex || !genotype || !provenance) return null;
  if (!isPlainString(record.phenotypeSlug, 160)) return null;
  if (!isPlainString(record.imageId, 160)) return null;
  if (!isPlainString(record.createdAt, 40) || !isPlainString(record.updatedAt, 40)) return null;
  return {
    schemaVersion: COLOR_LAB_SCHEMA_VERSION,
    rulesetVersion: record.rulesetVersion,
    id: record.id,
    name,
    sex,
    genotype,
    provenance,
    phenotypeSlug: record.phenotypeSlug,
    imageId: record.imageId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function parseDogRecordList(value: unknown): DogRecord[] {
  if (!Array.isArray(value)) return [];
  const dogs: DogRecord[] = [];
  for (const item of value) {
    const parsed = parseDogRecord(item);
    if (parsed) dogs.push(parsed);
  }
  return dogs;
}

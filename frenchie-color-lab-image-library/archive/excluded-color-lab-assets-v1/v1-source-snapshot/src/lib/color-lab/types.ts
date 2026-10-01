/** Color Lab genetics ruleset. Bump when resolver or locus catalog changes. */
export const COLOR_LAB_RULESET_VERSION = "1.0.0";
export const COLOR_LAB_STORAGE_KEY = "angel-bulldogs.color-lab.v1";
export const COLOR_LAB_SCHEMA_VERSION = 1;

export type LocusId =
  | "asip"
  | "tyrp1"
  | "cocoa"
  | "dilute"
  | "k"
  | "mc1r"
  | "mitf"
  | "merle"
  | "intensity"
  | "slc45a2"
  | "fgf5"
  | "foxi3"
  | "krt71"
  | "rspo2";

export type AlleleProvenance = "assumed" | "confirmed";
export type LabMode = "guided" | "advanced";
export type DogSex = "male" | "female";

export type SafetyFlagCode =
  | "double-merle"
  | "merle-merle-pairing"
  | "hairless-lethal"
  | "hairless-hairless-pairing"
  | "simplified-merle-model"
  | "assumed-wild-type";

export interface SafetyFlag {
  code: SafetyFlagCode;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface AlleleDefinition {
  id: string;
  label: string;
  aliases: string[];
  legacyAliases: string[];
  kind: "wild-type" | "variant" | "loss-of-function" | "dominant";
  help: string;
}

export type LocusGroupId = "base-pigment" | "pattern" | "modifiers" | "coat-type";

export interface LocusDefinition {
  id: LocusId;
  publicName: string;
  gene: string;
  notation: string;
  group: LocusGroupId;
  alleles: readonly AlleleDefinition[];
  displayOrder: readonly string[];
  defaultPair: readonly [string, string];
  guidedHelp: string;
  advancedHint: string;
  inheritanceHint: string;
}

export type AllelePair = readonly [string, string];
export type Genotype = Record<LocusId, AllelePair>;
export type ProvenanceMap = Record<LocusId, AlleleProvenance>;

export interface DogRecord {
  schemaVersion: number;
  rulesetVersion: string;
  id: string;
  name: string;
  sex: DogSex;
  genotype: Genotype;
  provenance: ProvenanceMap;
  phenotypeSlug: string;
  imageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedPhenotype {
  slug: string;
  commonName: string;
  breederTerm: boolean;
  scientificDescription: string;
  genotypeSummary: string;
  carriedTraits: string[];
  expressedTraits: string[];
  caveats: string[];
  imageId: string;
  safetyFlags: SafetyFlag[];
  nonviable: boolean;
  merleVisible: boolean;
  exampleGenotype: Genotype;
}

export interface PhenotypeOutcome {
  phenotype: ResolvedPhenotype;
  numerator: bigint;
  denominator: bigint;
  displayPercent: string;
  rawProbability: number;
}

export interface LocusGenotypeOutcome {
  locusId: LocusId;
  pair: AllelePair;
  label: string;
  numerator: bigint;
  denominator: bigint;
  displayPercent: string;
  expression: "expressed" | "carried" | "clear" | "nonviable";
}

export type InterestSource = "build" | "breeding";

export type LocusExpression = "expressed" | "carried" | "clear" | "nonviable";

export interface DogSnapshot {
  name: string;
  sex: DogSex;
  genotype: Genotype;
  provenance: ProvenanceMap;
  phenotypeSlug: string;
  phenotypeName: string;
}

export interface InterestVisitor {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  timeframe: string;
}

export interface InterestPayload {
  schemaVersion: number;
  rulesetVersion: string;
  source: InterestSource;
  submittedAt: string;
  visitor: InterestVisitor;
  puppy: {
    commonName: string;
    scientificDescription: string;
    slug: string;
    imageId: string;
    genotype: Genotype;
    provenance: ProvenanceMap;
    expressedTraits: string[];
    carriedTraits: string[];
    caveats: string[];
    safetyFlags: SafetyFlag[];
    probability: string | null;
  };
  stud: DogSnapshot | null;
  dam: DogSnapshot | null;
}

export interface BreedingResult {
  conceptionOutcomes: PhenotypeOutcome[];
  viableOutcomes: PhenotypeOutcome[];
  viableRenormalized: boolean;
  nonviableConceptionFraction: { n: bigint; d: bigint };
  nonviableDisplayPercent: string;
  locusOutcomes: LocusGenotypeOutcome[][];
  pairingFlags: SafetyFlag[];
  tiesForMostLikely: boolean;
  mostLikelyNames: string[];
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ColorPreset {
  id: string;
  label: string;
  group: string;
  genotype: Genotype;
  notes?: string;
}

/** Bump when the resolver, locus catalog, presets, or naming grammar change. */
export const COLOR_LAB_RULESET_VERSION = "2.0.0";
/** Saved-dog, locus, and preset schema. Version 1 records are migrated on load. */
export const COLOR_LAB_SCHEMA_VERSION = 2;
export const COLOR_LAB_STORAGE_KEY = "angel-bulldogs.color-lab.v2";
export const COLOR_LAB_LEGACY_STORAGE_KEY = "angel-bulldogs.color-lab.v1";

/** Active genetic loci. Big Rope is a visual preference and is deliberately not a locus. */
export const LOCUS_IDS = [
  "asip",
  "dilute",
  "cocoa",
  "tyrp1",
  "k",
  "mc1r",
  "mitf",
  "merle",
  "fgf5",
  "intensity",
  "slc45a2",
  "foxi3",
] as const;

export type LocusId = (typeof LOCUS_IDS)[number];
export type SectionId = "color" | "patterns" | "coat";

/** One canonical genotype-pair option ID per locus, for example `"D/d"`. */
export type Genotype = Readonly<Record<LocusId, string>>;

export type GenotypeStatus = "clear" | "carrier" | "expressed" | "concerning" | "nonviable";
export type Confirmation = "assumed" | "lab-confirmed";
export type DogSex = "male" | "female";

export interface DogState {
  readonly genotype: Genotype;
  readonly bigRope: boolean;
  readonly confirmation: Confirmation;
}

export interface AlleleDefinition {
  readonly id: string;
  readonly symbol: string;
}

export interface GenotypeOption {
  /** Canonical ID: alleles in dominance order joined by "/". */
  readonly id: string;
  readonly alleles: readonly [string, string];
  readonly label: string;
  readonly status: GenotypeStatus;
  /** False for conception-only outcomes such as FOXI3 Dup/Dup. */
  readonly selectable: boolean;
}

export interface LocusDefinition {
  readonly id: LocusId;
  readonly section: SectionId;
  readonly name: string;
  /** Short locus or gene label shown after the name, e.g. "ASIP" or "K locus". */
  readonly locusLabel: string | null;
  readonly geneSymbol: string;
  readonly help: string | null;
  /** Most dominant first. Canonical pair order and resolver precedence both use this order. */
  readonly alleles: readonly AlleleDefinition[];
  readonly options: readonly GenotypeOption[];
  readonly baseline: string;
}

export type AsipClass = "ady" | "asy" | "abb" | "a";
export type KClass = "KB" | "kbr" | "ky";
export type EClass = "Em" | "E" | "eA" | "e";
export type Copies = 0 | 1 | 2;

/** Everything the resolver needs from a genotype. Carrier detail is intentionally absent. */
export interface ExpressionProfile {
  readonly asip: AsipClass;
  readonly k: KClass;
  readonly e: EClass;
  readonly brown: boolean;
  readonly cocoa: boolean;
  readonly dilute: boolean;
  readonly pied: boolean;
  readonly merle: Copies;
  readonly fluffy: boolean;
  readonly intensity: boolean;
  readonly pink: boolean;
  readonly hairless: Copies;
}

export type PigmentFamily =
  | "black"
  | "chocolate"
  | "cocoa"
  | "new-shade-rojo"
  | "blue"
  | "isabella"
  | "lilac"
  | "new-shade-isabella";

export type CoatClass =
  | "solid"
  | "fawn"
  | "sable"
  | "and-tan"
  | "husky"
  | "cream-white"
  | "cream"
  | "platinum"
  | "pink";

export type VisualBase = "standard" | "fluffy" | "hairless";
export type EyeTreatment = "dark-brown" | "light-blue" | "blue";

export interface VisualRecipe {
  readonly base: VisualBase;
  readonly coat: CoatClass;
  /** Null when the coat hides eumelanin (cream, platinum, pink). */
  readonly pigment: PigmentFamily | null;
  readonly mask: boolean;
  readonly brindle: boolean;
  readonly merle: boolean;
  readonly pied: boolean;
  readonly eyes: EyeTreatment;
  readonly bigRope: boolean;
}

export interface NameTokens {
  readonly hairless: boolean;
  readonly color: string;
  readonly pattern: "And Tan" | "Husky" | null;
  readonly brindle: boolean;
  readonly merle: "Merle" | "Double Merle" | null;
  readonly pied: boolean;
  readonly solid: boolean;
  readonly fluffy: boolean;
  readonly bigRope: boolean;
}

export type MaskedTraitCode =
  | "color-hidden-by-pink"
  | "pattern-hidden-by-cream"
  | "pigment-hidden-by-cream"
  | "agouti-hidden-by-dominant-black"
  | "brindle-hidden-by-recessive-black"
  | "sable-grouped-under-brindle"
  | "sable-grouped-under-intensity"
  | "husky-needs-ky-and-tan"
  | "ea-with-dominant-black"
  | "intensity-no-phaeomelanin"
  | "intensity-points-not-shown"
  | "mask-detail"
  | "mask-not-distinguishable"
  | "merle-hidden"
  | "pied-hidden"
  | "fluffy-hidden-by-hairless";

export type NoticeCode =
  | "double-merle"
  | "merle-simplified"
  | "pied-variable"
  | "hairless-dentition"
  | "pink-albinism"
  | "intensity-dilution"
  | "nonviable-dup-dup"
  | "big-rope-visual";

interface VisiblePhenotypeCore {
  readonly publicName: string;
  readonly subtitle: string | null;
  readonly aliases: readonly string[];
  readonly tokens: NameTokens;
  readonly coat: CoatClass;
  /** Underlying eumelanin family from Brown, Cocoa, and Dilute, even when hidden. */
  readonly pigment: PigmentFamily;
  readonly recipe: VisualRecipe;
  readonly masked: readonly MaskedTraitCode[];
  readonly notices: readonly NoticeCode[];
  /** Aggregation key for litter results: kind plus public name and subtitle. */
  readonly key: string;
  readonly profile: ExpressionProfile;
}

export interface ViablePhenotype extends VisiblePhenotypeCore {
  readonly kind: "viable";
}

export interface ConcerningPhenotype extends VisiblePhenotypeCore {
  readonly kind: "concerning";
  readonly concern: "double-merle";
  readonly merleVisible: boolean;
}

export interface NonviableConception {
  readonly kind: "nonviable";
  readonly reason: "foxi3-dup-dup";
  readonly publicName: string;
  readonly notices: readonly NoticeCode[];
  readonly key: string;
}

export type VisiblePhenotype = ViablePhenotype | ConcerningPhenotype;
export type PhenotypeResult = VisiblePhenotype | NonviableConception;

export type AcknowledgementCode = "hairless" | "pink";

export type InterestEligibility =
  | { readonly eligible: false; readonly reason: "double-merle" | "nonviable" }
  | { readonly eligible: true; readonly acknowledgements: readonly AcknowledgementCode[] };

export interface ApprovedAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export type VisualResolution =
  | {
      readonly status: "approved";
      readonly visualId: string;
      readonly slug: string;
      readonly signature: string;
      /** Bottom to top. A single entry means an approved pre-composited derivative. */
      readonly layers: readonly ApprovedAsset[];
    }
  | {
      readonly status: "missing";
      readonly visualId: string;
      readonly slug: string;
      readonly signature: string;
      readonly missingLayers: readonly string[];
    };

export interface SavedDogPhenotype {
  readonly publicName: string;
  readonly kind: "viable" | "concerning";
  readonly visualId: string;
  readonly visibleSignature: string;
}

export interface SavedDog {
  readonly schemaVersion: typeof COLOR_LAB_SCHEMA_VERSION;
  readonly rulesetVersion: string;
  readonly id: string;
  readonly name: string;
  readonly sex: DogSex;
  readonly genotype: Genotype;
  readonly bigRope: boolean;
  readonly confirmation: Confirmation;
  readonly phenotype: SavedDogPhenotype;
  readonly notices: readonly NoticeCode[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

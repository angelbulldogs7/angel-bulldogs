export type PuppyStatus = "available" | "on-hold" | "reserved" | "sold";
export type PuppySex = "female" | "male";
export type ParentRole = "dam" | "sire";

export const PUPPY_STATUS_LABELS: Record<PuppyStatus, string> = {
  available: "Available",
  "on-hold": "On hold",
  reserved: "Reserved",
  sold: "Sold",
};

export interface MediaAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: "image" | "video";
}

export interface Parent {
  id: string;
  name: string;
  role: ParentRole;
  origin: string | null;
  dateOfBirth: string | null;
  coat: string | null;
  /** Null for a finished text-only parent section (e.g. Kiki). */
  portrait: MediaAsset | null;
  intro: string | null;
  /** Confirmed story points only. Never invent health, titles, or registration. */
  highlights: string[];
  // Unverified fields stay null until the owner supplies proof.
  // TODO: registration, healthTesting, weight, dnaPanel, pedigree, titles
  registration: null;
  healthTesting: null;
  weight: null;
  dnaPanel: null;
  pedigree: null;
  titles: null;
}

export interface Puppy {
  id: string;
  slug: string;
  name: string;
  status: PuppyStatus;
  sex: PuppySex;
  /**
   * Prefer shared litter birthDate. Per-puppy ISO YYYY-MM-DD only when a puppy
   * differs from the litter (none currently do).
   */
  dateOfBirth: string | null;
  color: string;
  /** Visible / breeder-assessed coat description (not a genotype string). */
  coatType: string;
  /**
   * Owner-assessed carrier traits from parental DNA and appearance.
   * Not individual puppy DNA test results.
   */
  estimatedCarrierTraits: readonly string[];
  shortDescription: string;
  longDescription: string;
  damId: string;
  sireId: string;
  primaryImage: MediaAsset;
  gallery: MediaAsset[];
  video: MediaAsset | null;
  featured: boolean;
  available: boolean;
  /** Layout-testing records. Real listings should be false. */
  placeholder: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string[];
  featured?: boolean;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

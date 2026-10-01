export type PuppyStatus = "available" | "unavailable";
export type PuppySex = "female" | "male";
export type ParentRole = "dam" | "sire";

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
  portrait: MediaAsset;
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
  /** ISO YYYY-MM-DD when confirmed. Null until the owner supplies a verified date. */
  dateOfBirth: string | null;
  color: string;
  coatType: string;
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

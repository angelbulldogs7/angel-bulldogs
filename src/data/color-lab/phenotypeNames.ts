import type { CoatClass, NameTokens, PigmentFamily } from "../../lib/color-lab/types";

/**
 * Eight core eumelanin names, resolved only from expressed (homozygous) Brown, Cocoa,
 * and Dilute. Carriers never change the visible pigment.
 */
export const PIGMENT_TABLE: readonly {
  readonly family: PigmentFamily;
  readonly name: string;
  readonly brown: boolean;
  readonly cocoa: boolean;
  readonly dilute: boolean;
}[] = [
  { family: "black", name: "Black", brown: false, cocoa: false, dilute: false },
  { family: "chocolate", name: "Chocolate", brown: true, cocoa: false, dilute: false },
  { family: "cocoa", name: "Cocoa", brown: false, cocoa: true, dilute: false },
  { family: "new-shade-rojo", name: "New Shade Rojo", brown: true, cocoa: true, dilute: false },
  { family: "blue", name: "Blue", brown: false, cocoa: false, dilute: true },
  { family: "isabella", name: "Isabella", brown: true, cocoa: false, dilute: true },
  { family: "lilac", name: "Lilac", brown: false, cocoa: true, dilute: true },
  { family: "new-shade-isabella", name: "New Shade Isabella", brown: true, cocoa: true, dilute: true },
];

export function pigmentFamily(expressed: {
  readonly brown: boolean;
  readonly cocoa: boolean;
  readonly dilute: boolean;
}): PigmentFamily {
  const row = PIGMENT_TABLE.find(
    (item) =>
      item.brown === expressed.brown && item.cocoa === expressed.cocoa && item.dilute === expressed.dilute,
  );
  if (!row) throw new Error("Pigment table is incomplete.");
  return row.family;
}

export function pigmentName(family: PigmentFamily): string {
  const row = PIGMENT_TABLE.find((item) => item.family === family);
  if (!row) throw new Error(`Unknown pigment family: ${family}`);
  return row.name;
}

/**
 * Merle only shows on black-based (eumelanin) pigment. Brindle stripes are eumelanin, so a
 * visible Brindle also lets Merle show on fawn and Cream/White grounds.
 */
export const MERLE_VISIBLE_ON: Readonly<Record<CoatClass, boolean>> = {
  solid: true,
  "and-tan": true,
  husky: true,
  fawn: false,
  sable: false,
  "cream-white": false,
  cream: false,
  platinum: false,
  pink: false,
};

/**
 * Pied stays in the name only where the representative white-spotting map is genuinely
 * distinguishable. On very pale coats it is kept in DNA details instead of inventing contrast.
 */
export const PIED_VISIBLE_ON: Readonly<Record<CoatClass, boolean>> = {
  solid: true,
  "and-tan": true,
  husky: true,
  fawn: true,
  sable: true,
  "cream-white": false,
  cream: false,
  platinum: false,
  pink: false,
};

/** Public-name token order. Hairless leads; Big Rope is always last. */
export const NAME_TOKEN_ORDER: readonly (keyof NameTokens)[] = [
  "hairless",
  "color",
  "pattern",
  "brindle",
  "merle",
  "pied",
  "solid",
  "fluffy",
  "bigRope",
];

export const INTENSITY_SUBTITLE = "Intensity Dilution";
export const TRICOLOR_ALIAS = "Tricolor";

export const BREEDER_TERMS_NOTE =
  "Lilac, Isabella, New Shade Rojo, New Shade Isabella, Platinum, and Big Rope are breeder-facing names layered over the DNA shown, not universal laboratory nomenclature.";

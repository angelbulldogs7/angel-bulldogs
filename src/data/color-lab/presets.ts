import type { LocusId } from "../../lib/color-lab/types";

export type PresetGroupId = "core" | "patterns" | "coat";

export interface ColorPreset {
  readonly id: string;
  readonly label: string;
  readonly group: PresetGroupId;
  /** Overrides applied to the complete Masked Classic Fawn baseline. */
  readonly overrides: Readonly<Partial<Record<LocusId, string>>>;
  readonly bigRope: boolean;
}

export const PRESET_GROUPS: readonly { readonly id: PresetGroupId; readonly title: string }[] = [
  { id: "core", title: "Core Colors" },
  { id: "patterns", title: "Patterns" },
  { id: "coat", title: "Coat & Rare Traits" },
];

function preset(
  id: string,
  label: string,
  group: PresetGroupId,
  overrides: Partial<Record<LocusId, string>> = {},
  bigRope = false,
): ColorPreset {
  return { id, label, group, overrides, bigRope };
}

/** "Full black pigment" means B/B, Co/Co, D/D — spelled out so no preset relies on leftovers. */
const FULL_BLACK = { tyrp1: "B/B", cocoa: "Co/Co", dilute: "D/D" } as const;

/** All 24 View All presets, in drawer order. Every preset starts from the full baseline. */
export const PRESETS: readonly ColorPreset[] = [
  preset("fawn", "Fawn", "core"),
  preset("cream", "Cream", "core", { mc1r: "e/e" }),
  preset("black", "Black", "core", { k: "KB/KB", ...FULL_BLACK }),
  preset("chocolate", "Chocolate", "core", { k: "KB/KB", tyrp1: "b/b", cocoa: "Co/Co", dilute: "D/D" }),
  preset("cocoa", "Cocoa", "core", { k: "KB/KB", tyrp1: "B/B", cocoa: "co/co", dilute: "D/D" }),
  preset("blue", "Blue", "core", { k: "KB/KB", tyrp1: "B/B", cocoa: "Co/Co", dilute: "d/d" }),
  preset("isabella", "Isabella", "core", { k: "KB/KB", tyrp1: "b/b", cocoa: "Co/Co", dilute: "d/d" }),
  preset("lilac", "Lilac", "core", { k: "KB/KB", dilute: "d/d", cocoa: "co/co" }),
  preset("new-shade-rojo", "New Shade Rojo", "core", { k: "KB/KB", tyrp1: "b/b", cocoa: "co/co", dilute: "D/D" }),
  preset("new-shade-isabella", "New Shade Isabella", "core", {
    k: "KB/KB",
    tyrp1: "b/b",
    cocoa: "co/co",
    dilute: "d/d",
  }),
  preset("platinum", "Platinum", "core", { mc1r: "e/e", dilute: "d/d", cocoa: "co/co", tyrp1: "B/B" }),
  preset("platinum-new-shade-isabella", "Platinum New Shade Isabella", "core", {
    mc1r: "e/e",
    tyrp1: "b/b",
    cocoa: "co/co",
    dilute: "d/d",
  }),
  preset("cream-white-intensity", "Cream/White Intensity Dilution", "core", { intensity: "In/In" }),
  preset("sable", "Sable", "core", { asip: "asy/asy" }),
  preset("fawn-pied", "Fawn Pied", "patterns", { mitf: "S/S" }),
  preset("black-and-tan", "Black And Tan", "patterns", {
    asip: "abb/abb",
    k: "ky/ky",
    mc1r: "E/E",
    ...FULL_BLACK,
  }),
  preset("fawn-brindle", "Fawn Brindle", "patterns", { k: "kbr/kbr" }),
  preset("black-merle", "Black Merle", "patterns", { k: "KB/KB", ...FULL_BLACK, merle: "M/m" }),
  preset("blue-merle", "Blue Merle", "patterns", {
    k: "KB/KB",
    tyrp1: "B/B",
    cocoa: "Co/Co",
    dilute: "d/d",
    merle: "M/m",
  }),
  preset("husky", "Husky", "patterns", { asip: "abb/abb", k: "ky/ky", mc1r: "eA/eA", ...FULL_BLACK }),
  preset("new-shade-isabella-fluffy", "New Shade Isabella Fluffy", "coat", {
    k: "KB/KB",
    tyrp1: "b/b",
    cocoa: "co/co",
    dilute: "d/d",
    fgf5: "l/l",
  }),
  preset("pink", "Pink", "coat", { slc45a2: "alb/alb" }),
  preset("fawn-hairless", "Fawn Hairless", "coat", { foxi3: "N/Dup" }),
  preset("fawn-big-rope", "Fawn Big Rope", "coat", {}, true),
];

/** Shown directly above the gene controls, in this order. */
export const QUICK_PRESET_IDS: readonly string[] = [
  "fawn",
  "cream",
  "lilac",
  "new-shade-isabella",
  "new-shade-rojo",
  "platinum",
  "fawn-pied",
  "new-shade-isabella-fluffy",
  "pink",
];

export function getPreset(id: string): ColorPreset | undefined {
  return PRESETS.find((item) => item.id === id);
}

export function quickPresets(): ColorPreset[] {
  return QUICK_PRESET_IDS.map((id) => {
    const found = getPreset(id);
    if (!found) throw new Error(`Quick preset missing from catalog: ${id}`);
    return found;
  });
}

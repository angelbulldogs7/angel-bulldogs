import { canonicalizePair, cloneGenotype, defaultGenotype } from "../../lib/color-lab/genotype";
import type { ColorPreset, Genotype, LocusId } from "../../lib/color-lab/types";

function withLoci(overrides: Partial<Genotype>): Genotype {
  const genotype = defaultGenotype();
  for (const id of Object.keys(overrides) as LocusId[]) {
    const pair = overrides[id];
    if (!pair) continue;
    genotype[id] = canonicalizePair(id, pair[0], pair[1]);
  }
  return genotype;
}

/**
 * Every preset is a complete 14-locus genotype. Applying one replaces every
 * locus — never leave alleles behind from the previous dog.
 */
export const COLOR_PRESETS: readonly ColorPreset[] = [
  {
    id: "classic-fawn",
    label: "Classic Fawn",
    group: "Standard",
    genotype: withLoci({}),
    notes: "ky/ky, DY/DY, Em/Em, remaining loci wild-type/default.",
  },
  {
    id: "shaded-fawn",
    label: "Shaded Fawn",
    group: "Standard",
    genotype: withLoci({ asip: ["sy", "sy"] }),
  },
  {
    id: "brindle",
    label: "Brindle",
    group: "Standard",
    genotype: withLoci({ k: ["kbr", "kbr"] }),
  },
  {
    id: "cream",
    label: "Cream",
    group: "Standard",
    genotype: withLoci({ mc1r: ["e", "e"] }),
  },
  {
    id: "black",
    label: "Black",
    group: "Standard",
    genotype: withLoci({ k: ["KB", "KB"] }),
  },
  {
    id: "fawn-pied",
    label: "Fawn Pied",
    group: "Pied",
    genotype: withLoci({ mitf: ["S", "S"] }),
  },
  {
    id: "brindle-pied",
    label: "Brindle Pied",
    group: "Pied",
    genotype: withLoci({ k: ["kbr", "kbr"], mitf: ["S", "S"] }),
  },
  {
    id: "cream-pied",
    label: "Cream Pied",
    group: "Pied",
    genotype: withLoci({ mc1r: ["e", "e"], mitf: ["S", "S"] }),
  },
  {
    id: "blue",
    label: "Blue",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], dilute: ["d1", "d1"] }),
  },
  {
    id: "chocolate",
    label: "Chocolate",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], tyrp1: ["bs", "bs"] }),
  },
  {
    id: "cocoa",
    label: "Cocoa",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], cocoa: ["co", "co"] }),
  },
  {
    id: "lilac",
    label: "Lilac",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], tyrp1: ["bs", "bs"], dilute: ["d1", "d1"] }),
    notes: "Breeder term for TYRP1 brown with MLPH dilution.",
  },
  {
    id: "isabella",
    label: "Isabella",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], cocoa: ["co", "co"], dilute: ["d1", "d1"] }),
    notes: "Breeder term for cocoa with dilution.",
  },
  {
    id: "new-shade",
    label: "New Shade",
    group: "Dilute & brown",
    genotype: withLoci({ k: ["KB", "KB"], tyrp1: ["bs", "bs"], cocoa: ["co", "co"] }),
    notes: "Breeder term for brown plus cocoa.",
  },
  {
    id: "new-shade-isabella",
    label: "New Shade Isabella",
    group: "Dilute & brown",
    genotype: withLoci({
      k: ["KB", "KB"],
      tyrp1: ["bs", "bs"],
      cocoa: ["co", "co"],
      dilute: ["d1", "d1"],
    }),
  },
  {
    id: "rojo",
    label: "Rojo",
    group: "Cream family",
    genotype: withLoci({ mc1r: ["e", "e"], cocoa: ["co", "co"] }),
    notes: "Breeder term for e/e with cocoa.",
  },
  {
    id: "new-shade-rojo",
    label: "New Shade Rojo",
    group: "Cream family",
    genotype: withLoci({ mc1r: ["e", "e"], tyrp1: ["bs", "bs"], cocoa: ["co", "co"] }),
  },
  {
    id: "black-and-tan",
    label: "Black and Tan",
    group: "Tan point",
    genotype: withLoci({ asip: ["bs", "bs"] }),
  },
  {
    id: "chocolate-and-tan",
    label: "Chocolate and Tan",
    group: "Tan point",
    genotype: withLoci({ asip: ["bs", "bs"], tyrp1: ["bs", "bs"] }),
  },
  {
    id: "blue-and-tan",
    label: "Blue and Tan",
    group: "Tan point",
    genotype: withLoci({ asip: ["bs", "bs"], dilute: ["d1", "d1"] }),
  },
  {
    id: "black-merle",
    label: "Black Merle",
    group: "Merle",
    genotype: withLoci({ k: ["KB", "KB"], merle: ["M", "m"] }),
  },
  {
    id: "blue-merle",
    label: "Blue Merle",
    group: "Merle",
    genotype: withLoci({ k: ["KB", "KB"], dilute: ["d1", "d1"], merle: ["M", "m"] }),
  },
  {
    id: "chocolate-merle",
    label: "Chocolate Merle",
    group: "Merle",
    genotype: withLoci({ k: ["KB", "KB"], tyrp1: ["bs", "bs"], merle: ["M", "m"] }),
  },
  {
    id: "lilac-merle",
    label: "Lilac Merle",
    group: "Merle",
    genotype: withLoci({
      k: ["KB", "KB"],
      tyrp1: ["bs", "bs"],
      dilute: ["d1", "d1"],
      merle: ["M", "m"],
    }),
  },
  {
    id: "brindle-merle",
    label: "Brindle Merle",
    group: "Merle",
    genotype: withLoci({ k: ["kbr", "kbr"], merle: ["M", "m"] }),
  },
  {
    id: "fluffy-fawn",
    label: "Fluffy Fawn",
    group: "Coat type",
    genotype: withLoci({ fgf5: ["L4", "L4"] }),
  },
  {
    id: "fluffy-cream",
    label: "Fluffy Cream",
    group: "Coat type",
    genotype: withLoci({ mc1r: ["e", "e"], fgf5: ["L4", "L4"] }),
  },
  {
    id: "curly-fluffy",
    label: "Curly Fluffy",
    group: "Coat type",
    genotype: withLoci({ fgf5: ["L4", "L4"], krt71: ["C1", "C1"] }),
  },
  {
    id: "furnished-fawn",
    label: "Furnished Fawn",
    group: "Coat type",
    genotype: withLoci({ rspo2: ["F", "F"] }),
  },
  {
    id: "hairless-fawn",
    label: "Hairless Fawn",
    group: "Coat type",
    genotype: withLoci({ foxi3: ["N", "Dup"] }),
  },
  {
    id: "pink",
    label: "Pink",
    group: "Modifiers",
    genotype: withLoci({ slc45a2: ["ca", "ca"] }),
  },
];

export const CLASSIC_FAWN_PRESET_ID = "classic-fawn";

export function getPreset(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((item) => item.id === id);
}

export function applyPreset(id: string): Genotype | null {
  const preset = getPreset(id);
  if (!preset) return null;
  return cloneGenotype(preset.genotype);
}

export function presetGroups(): { group: string; presets: ColorPreset[] }[] {
  const groups: { group: string; presets: ColorPreset[] }[] = [];
  for (const preset of COLOR_PRESETS) {
    const existing = groups.find((item) => item.group === preset.group);
    if (existing) existing.presets.push(preset);
    else groups.push({ group: preset.group, presets: [preset] });
  }
  return groups;
}

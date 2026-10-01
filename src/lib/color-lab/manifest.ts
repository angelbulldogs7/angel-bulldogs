import { getLocus, locusRowLabel } from "../../data/color-lab/loci";
import {
  ANCHORS,
  COLOR_LAB_ASSET_LIBRARY_VERSION,
  VISUAL_DISCLOSURE,
  VISUAL_HEIGHT,
  VISUAL_WIDTH,
  expectedLayerFile,
} from "../../data/color-lab/visualRegistry";
import { alleleSymbol, displayGenotype, requireOption } from "./genotype";
import {
  completeProfile,
  locusContribution,
  resolveProfile,
  type ProfileContribution,
} from "./phenotypeResolver";
import type { EyeTreatment, LocusId, NoticeCode, VisualRecipe } from "./types";
import { COLOR_LAB_RULESET_VERSION, LOCUS_IDS } from "./types";
import { DEFAULT_VISUAL_REGISTRY, resolveVisual, type VisualRegistry } from "./visualCache";
import { requiredLayers, visibleSignature, visualAlt, visualIdFor, visualSlug } from "./visualRecipe";

export const MANIFEST_VERSION = 2;

interface ProfileClass {
  /** Readable class label: a single genotype such as "d/d", or "D/–" for any pair led by D. */
  readonly id: string;
  readonly contribution: ProfileContribution;
  readonly options: string[];
}

/** Selectable genotypes grouped by what they contribute to appearance. */
function locusClasses(locus: LocusId): ProfileClass[] {
  const grouped = new Map<string, { contribution: ProfileContribution; options: string[] }>();
  for (const option of getLocus(locus).options) {
    if (!option.selectable) continue;
    const contribution = locusContribution(locus, option.id);
    const key = JSON.stringify(contribution);
    const existing = grouped.get(key);
    if (existing) existing.options.push(option.id);
    else grouped.set(key, { contribution, options: [option.id] });
  }
  return [...grouped.values()].map(({ contribution, options }) => {
    const first = options[0];
    if (first === undefined) throw new Error(`Empty genotype class at ${locus}.`);
    const id =
      options.length === 1
        ? displayGenotype(locus, first)
        : `${alleleSymbol(locus, requireOption(locus, first).alleles[0])}/–`;
    return { id, contribution, options };
  });
}

type Clause = number[][];

function clauseKey(clause: Clause, skip: number): string {
  return clause.map((set, index) => (index === skip ? "*" : set.join(","))).join("|");
}

/**
 * Exact compression of a recipe's preimage into disjoint product clauses. Two clauses merge
 * only when they agree on every other locus, so their union is always preserved exactly.
 */
function compressPreimage(vectors: readonly number[][]): Clause[] {
  let clauses: Clause[] = vectors.map((vector) => vector.map((value) => [value]));
  const mergeOrder = [...LOCUS_IDS.keys()].reverse();
  let changed = true;
  while (changed) {
    changed = false;
    for (const dimension of mergeOrder) {
      const merged = new Map<string, Clause>();
      for (const clause of clauses) {
        const key = clauseKey(clause, dimension);
        const existing = merged.get(key);
        if (existing) {
          existing[dimension] = [...new Set([...existing[dimension], ...clause[dimension]])].sort((a, b) => a - b);
        } else {
          merged.set(key, clause.map((set) => [...set]));
        }
      }
      if (merged.size < clauses.length) changed = true;
      clauses = [...merged.values()];
    }
  }
  return clauses;
}

export interface ManifestLayer {
  readonly id: string;
  readonly status: "approved" | "missing";
  readonly file: string | null;
  readonly expectedFile: string;
  readonly usedByRecipes: number;
}

export interface ManifestRecipe {
  readonly visualId: string;
  readonly slug: string;
  readonly publicNames: readonly string[];
  readonly visibleSignature: string;
  /** Render recipe: approved layers stacked bottom to top. */
  readonly layers: readonly string[];
  readonly missingLayers: readonly string[];
  /** Genotype classes (see classLegend) that all render this visual. Omitted loci allow any value. */
  readonly equivalence: readonly Readonly<Partial<Record<LocusId, readonly string[]>>>[];
  readonly profileCount: number;
  readonly eyes: EyeTreatment;
  readonly notices: readonly NoticeCode[];
  readonly status: "approved" | "missing";
  readonly derivative: string | null;
  readonly alt: string;
}

export interface VisualManifest {
  readonly manifestVersion: number;
  readonly rulesetVersion: string;
  readonly assetLibraryVersion: string;
  readonly generatedBy: string;
  readonly frame: { readonly width: number; readonly height: number; readonly aspectRatio: "4:5" };
  readonly disclosure: string;
  readonly counts: {
    readonly visualRecipes: number;
    readonly approvedRecipes: number;
    readonly missingRecipes: number;
    readonly layers: number;
    readonly approvedLayers: number;
    readonly viableProfilesEnumerated: number;
    readonly doubleMerleProfilesToSafetyPanel: number;
  };
  readonly axes: readonly { readonly axis: string; readonly values: readonly string[]; readonly rule: string }[];
  readonly eyeRules: Readonly<Record<EyeTreatment, string>>;
  readonly anchors: typeof ANCHORS;
  readonly classLegend: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
  readonly safetyPanels: readonly { readonly id: string; readonly appliesTo: string; readonly image: null }[];
  readonly layers: readonly ManifestLayer[];
  readonly recipes: readonly ManifestRecipe[];
}

export const EYE_RULES: Readonly<Record<EyeTreatment, string>> = {
  "light-blue": "Pink → light blue (representative, not a prediction)",
  blue: "Visible Merle → two blue eyes (representative, not a prediction)",
  "dark-brown": "Default → dark brown (Intensity Dilution does not change the eye treatment)",
};

export const MANIFEST_AXES: VisualManifest["axes"] = [
  { axis: "base", values: ["standard", "fluffy", "hairless"], rule: "Hairless (N/Dup) overrides Fluffy (l/l)." },
  {
    axis: "coat",
    values: ["solid", "fawn", "sable", "and-tan", "husky", "cream-white", "cream", "platinum", "pink"],
    rule: "Pink > e/e (Cream/Platinum) > K and Agouti; In/In turns fawn and sable grounds Cream/White.",
  },
  {
    axis: "pigment",
    values: [
      "black",
      "chocolate",
      "cocoa",
      "new-shade-rojo",
      "blue",
      "isabella",
      "lilac",
      "new-shade-isabella",
      "none",
    ],
    rule: "From expressed Brown, Cocoa, and Dilute; none on Cream, Platinum, and Pink coats.",
  },
  { axis: "mask", values: ["0", "1"], rule: "Eᴹ on fawn, sable, and non-brindle Cream/White faces only." },
  {
    axis: "brindle",
    values: ["0", "1"],
    rule: "kᵇʳ without Kᴮ over a fawn, sable, Cream/White, or And Tan pattern (one representative map).",
  },
  {
    axis: "merle",
    values: ["0", "1"],
    rule: "M/m on eumelanin-bearing coats or brindle stripes (one representative map). M/M uses a safety panel.",
  },
  {
    axis: "pied",
    values: ["0", "1"],
    rule: "S/S where the white map is distinguishable: not on Cream, Platinum, Cream/White, or Pink.",
  },
  {
    axis: "eyes",
    values: ["dark-brown", "light-blue", "blue"],
    rule: "Derived, not an independent axis: Pink → light blue; visible Merle → blue; else dark brown.",
  },
  { axis: "bigRope", values: ["0", "1"], rule: "Visual preference only; never genetic." },
];

interface RecipeAccumulator {
  readonly recipe: VisualRecipe;
  readonly names: Set<string>;
  readonly notices: Set<NoticeCode>;
  readonly vectors: number[][];
}

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function buildVisualManifest(registry: VisualRegistry = DEFAULT_VISUAL_REGISTRY): VisualManifest {
  const classes = LOCUS_IDS.map((locus) => locusClasses(locus));
  const recipes = new Map<string, RecipeAccumulator>();
  let viableProfiles = 0;
  let doubleMerleProfiles = 0;
  const vector: number[] = [];

  const visit = (depth: number, partial: ProfileContribution): void => {
    if (depth === LOCUS_IDS.length) {
      const profile = completeProfile(partial);
      for (const bigRope of [false, true]) {
        const result = resolveProfile(profile, { bigRope });
        if (result.kind === "nonviable") continue;
        if (result.kind === "concerning") {
          if (!bigRope) doubleMerleProfiles += 1;
          continue;
        }
        if (!bigRope) viableProfiles += 1;
        const signature = visibleSignature(result.recipe);
        let acc = recipes.get(signature);
        if (!acc) {
          acc = { recipe: result.recipe, names: new Set(), notices: new Set(), vectors: [] };
          recipes.set(signature, acc);
        }
        acc.names.add(result.publicName);
        for (const notice of result.notices) acc.notices.add(notice);
        acc.vectors.push([...vector]);
      }
      return;
    }
    classes[depth].forEach((item, index) => {
      vector[depth] = index;
      visit(depth + 1, { ...partial, ...item.contribution });
    });
  };
  visit(0, {});

  const layerUsage = new Map<string, number>();
  const manifestRecipes: ManifestRecipe[] = [...recipes.entries()].map(([signature, acc]) => {
    const resolution = resolveVisual(acc.recipe, registry);
    const layers = requiredLayers(acc.recipe);
    for (const id of layers) layerUsage.set(id, (layerUsage.get(id) ?? 0) + 1);
    const slug = visualSlug(acc.recipe);
    const derivative = Object.hasOwn(registry.derivatives, slug) ? (registry.derivatives[slug]?.src ?? null) : null;
    const names = [...acc.names].sort(compareText);
    const equivalence = compressPreimage(acc.vectors).map((clause) => {
      const output: Partial<Record<LocusId, string[]>> = {};
      clause.forEach((set, index) => {
        const locusClassesAt = classes[index];
        if (set.length === locusClassesAt.length) return;
        output[LOCUS_IDS[index]] = set.map((classIndex) => locusClassesAt[classIndex].id);
      });
      return output;
    });
    return {
      visualId: visualIdFor(signature),
      slug,
      publicNames: names,
      visibleSignature: signature,
      layers,
      missingLayers: resolution.status === "missing" ? resolution.missingLayers : [],
      equivalence,
      profileCount: acc.vectors.length,
      eyes: acc.recipe.eyes,
      notices: [...acc.notices].sort(compareText),
      status: resolution.status,
      derivative,
      alt: visualAlt(names.join(" / "), resolution.status === "approved"),
    };
  });
  manifestRecipes.sort((a, b) => compareText(a.slug, b.slug));

  const manifestLayers: ManifestLayer[] = [...layerUsage.entries()]
    .map(([id, usedByRecipes]) => {
      const approved = Object.hasOwn(registry.layers, id) ? registry.layers[id] : undefined;
      return {
        id,
        status: approved ? ("approved" as const) : ("missing" as const),
        file: approved?.src ?? null,
        expectedFile: expectedLayerFile(id),
        usedByRecipes,
      };
    })
    .sort((a, b) => compareText(a.id, b.id));

  const classLegend: Record<string, Record<string, string[]>> = {};
  LOCUS_IDS.forEach((locus, index) => {
    const legend: Record<string, string[]> = {};
    for (const item of classes[index]) legend[item.id] = item.options.map((option) => displayGenotype(locus, option));
    classLegend[`${locus} (${locusRowLabel(getLocus(locus))})`] = legend;
  });

  const approvedRecipes = manifestRecipes.filter((item) => item.status === "approved").length;
  return {
    manifestVersion: MANIFEST_VERSION,
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    assetLibraryVersion: COLOR_LAB_ASSET_LIBRARY_VERSION,
    generatedBy: "npm run color-lab:manifest",
    frame: { width: VISUAL_WIDTH, height: VISUAL_HEIGHT, aspectRatio: "4:5" },
    disclosure: VISUAL_DISCLOSURE,
    counts: {
      visualRecipes: manifestRecipes.length,
      approvedRecipes,
      missingRecipes: manifestRecipes.length - approvedRecipes,
      layers: manifestLayers.length,
      approvedLayers: manifestLayers.filter((item) => item.status === "approved").length,
      viableProfilesEnumerated: viableProfiles,
      doubleMerleProfilesToSafetyPanel: doubleMerleProfiles,
    },
    axes: MANIFEST_AXES,
    eyeRules: EYE_RULES,
    anchors: ANCHORS,
    classLegend,
    safetyPanels: [
      {
        id: "double-merle-warning",
        appliesTo: "Every M/M outcome, visible or masked. Shown as a warning panel, never a puppy image.",
        image: null,
      },
      {
        id: "nonviable-conception",
        appliesTo: "FOXI3 Dup/Dup. Listed only in the Genotypes tab; no card, image, or panel artwork.",
        image: null,
      },
    ],
    layers: manifestLayers,
    recipes: manifestRecipes,
  };
}

/** Pretty metadata with one layer or recipe per line, so diffs stay reviewable. */
export function serializeManifest(manifest: VisualManifest): string {
  const { layers, recipes, ...meta } = manifest;
  const head = JSON.stringify(meta, null, 2).replace(/\n}$/, "");
  const list = (items: readonly unknown[]) => items.map((item) => `    ${JSON.stringify(item)}`).join(",\n");
  return `${head},\n  "layers": [\n${list(layers)}\n  ],\n  "recipes": [\n${list(recipes)}\n  ]\n}\n`;
}

export function manifestSummaryMarkdown(manifest: VisualManifest): string {
  const count = (key: (recipe: ManifestRecipe) => string) => {
    const map = new Map<string, number>();
    for (const recipe of manifest.recipes) map.set(key(recipe), (map.get(key(recipe)) ?? 0) + 1);
    return [...map.entries()]
      .sort((a, b) => compareText(a[0], b[0]))
      .map(([value, total]) => `| ${value} | ${total} |`)
      .join("\n");
  };
  const field = (recipe: ManifestRecipe, name: string) =>
    recipe.visibleSignature.split(";").find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
  const c = manifest.counts;
  const layerLines = manifest.layers
    .map((layer) => `| \`${layer.id}\` | ${layer.status} | ${layer.usedByRecipes} |`)
    .join("\n");
  return `# Frenchie Color Lab visual manifest summary

Generated by \`${manifest.generatedBy}\` from the active simplified model. Do not edit by hand.

- Ruleset: ${manifest.rulesetVersion}
- Asset library: ${manifest.assetLibraryVersion}
- Frame: ${manifest.frame.width}×${manifest.frame.height} (${manifest.frame.aspectRatio})

## Counts

| Measure | Count |
| --- | --- |
| Deduplicated visible recipes | ${c.visualRecipes} |
| Approved recipes | ${c.approvedRecipes} |
| Missing recipes (render "Image coming soon") | ${c.missingRecipes} |
| Distinct required layers | ${c.layers} |
| Approved layers | ${c.approvedLayers} |
| Viable expression profiles enumerated (Big Rope off) | ${c.viableProfilesEnumerated} |
| Double Merle profiles routed to the safety panel | ${c.doubleMerleProfilesToSafetyPanel} |

Hidden carriers never create a new recipe: every genotype pair collapses to the expression
profile it contributes before recipes are counted.

## Axes

| Axis | Values | Rule |
| --- | --- | --- |
${manifest.axes.map((axis) => `| ${axis.axis} | ${axis.values.join(", ")} | ${axis.rule} |`).join("\n")}

## Recipes by base

| Base | Recipes |
| --- | --- |
${count((recipe) => field(recipe, "base"))}

## Recipes by coat

| Coat | Recipes |
| --- | --- |
${count((recipe) => field(recipe, "coat"))}

## Layer checklist

| Layer | Status | Used by recipes |
| --- | --- | --- |
${layerLines}
`;
}

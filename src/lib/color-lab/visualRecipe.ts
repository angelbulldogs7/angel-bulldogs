import type { PigmentFamily, VisualRecipe } from "./types";

/** Only traits that change the image. Hidden carriers, names, sex, and confirmation never enter. */
export function visibleSignature(recipe: VisualRecipe): string {
  return [
    `base=${recipe.base}`,
    `coat=${recipe.coat}`,
    `pigment=${recipe.pigment ?? "none"}`,
    `mask=${recipe.mask ? 1 : 0}`,
    `brindle=${recipe.brindle ? 1 : 0}`,
    `merle=${recipe.merle ? 1 : 0}`,
    `pied=${recipe.pied ? 1 : 0}`,
    `eyes=${recipe.eyes}`,
    `bigRope=${recipe.bigRope ? 1 : 0}`,
  ].join(";");
}

/** FNV-1a (32-bit). Deterministic across runtimes. */
export function stableHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function visualIdFor(signature: string): string {
  return `clv2-${stableHash(signature)}`;
}

function requirePigment(recipe: VisualRecipe): PigmentFamily {
  if (!recipe.pigment) throw new Error(`Visual recipe for ${recipe.coat} needs a pigment family.`);
  return recipe.pigment;
}

/** Ground color plus visible pigment, without pattern overlays. */
export function coatLayerKey(recipe: VisualRecipe): string {
  switch (recipe.coat) {
    case "solid":
      return requirePigment(recipe);
    case "fawn":
    case "sable": {
      const pigment = requirePigment(recipe);
      return pigment === "black" ? recipe.coat : `${pigment}-${recipe.coat}`;
    }
    case "and-tan":
    case "husky":
      return `${requirePigment(recipe)}-${recipe.coat}`;
    case "cream-white": {
      const pigment = requirePigment(recipe);
      return pigment === "black" ? "cream-white" : `cream-white-${pigment}-pigment`;
    }
    case "cream":
    case "platinum":
    case "pink":
      return recipe.coat;
  }
}

function showsSolid(recipe: VisualRecipe): boolean {
  return (
    !recipe.brindle &&
    !recipe.merle &&
    !recipe.pied &&
    recipe.coat !== "and-tan" &&
    recipe.coat !== "husky"
  );
}

export function visualSlug(recipe: VisualRecipe): string {
  const parts = [
    recipe.base === "standard" ? null : recipe.base,
    coatLayerKey(recipe),
    recipe.brindle ? "brindle" : null,
    recipe.merle ? "merle" : null,
    recipe.pied ? "pied" : null,
    showsSolid(recipe) ? "solid" : null,
    recipe.mask ? "masked" : null,
    recipe.bigRope ? "big-rope" : null,
  ];
  return parts.filter((part): part is string => part !== null).join("-");
}

/** Approved layers needed for a recipe, bottom to top. Dark-brown eyes are native to anchors. */
export function requiredLayers(recipe: VisualRecipe): string[] {
  const base = recipe.base;
  const layers = [`anchor/${base}`, `coat/${base}/${coatLayerKey(recipe)}`];
  if (recipe.mask) layers.push(`mask/${base}/${requirePigment(recipe)}`);
  if (recipe.brindle) layers.push(`brindle/${base}/${requirePigment(recipe)}`);
  if (recipe.merle) layers.push(`merle/${base}/${requirePigment(recipe)}`);
  if (recipe.pied) layers.push(`pied/${base}`);
  if (recipe.eyes !== "dark-brown") layers.push(`eyes/${base}/${recipe.eyes}`);
  if (recipe.bigRope) layers.push(`big-rope/${base}`);
  return layers;
}

export function visualAlt(publicName: string, approved: boolean): string {
  return approved
    ? `Representative ${publicName} French Bulldog puppy. AI-generated visualization; real appearance varies.`
    : `Image coming soon: ${publicName} representative visualization.`;
}

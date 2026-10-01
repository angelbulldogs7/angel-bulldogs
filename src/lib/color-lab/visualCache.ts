import { APPROVED_DERIVATIVES, APPROVED_LAYERS } from "../../data/color-lab/visualRegistry";
import type { ApprovedAsset, VisualRecipe, VisualResolution } from "./types";
import { requiredLayers, visibleSignature, visualIdFor, visualSlug } from "./visualRecipe";

export interface VisualRegistry {
  readonly layers: Readonly<Record<string, ApprovedAsset | undefined>>;
  readonly derivatives: Readonly<Record<string, ApprovedAsset | undefined>>;
}

export const DEFAULT_VISUAL_REGISTRY: VisualRegistry = {
  layers: APPROVED_LAYERS,
  derivatives: APPROVED_DERIVATIVES,
};

function lookup(table: VisualRegistry["layers"], id: string): ApprovedAsset | undefined {
  return Object.hasOwn(table, id) ? table[id] : undefined;
}

/** Exact lookup only. Any missing layer means "Image coming soon" — never a nearby substitute. */
export function resolveVisual(
  recipe: VisualRecipe,
  registry: VisualRegistry = DEFAULT_VISUAL_REGISTRY,
): VisualResolution {
  const signature = visibleSignature(recipe);
  const slug = visualSlug(recipe);
  const visualId = visualIdFor(signature);

  const derivative = lookup(registry.derivatives, slug);
  if (derivative) return { status: "approved", visualId, slug, signature, layers: [derivative] };

  const layers: ApprovedAsset[] = [];
  const missingLayers: string[] = [];
  for (const id of requiredLayers(recipe)) {
    const asset = lookup(registry.layers, id);
    if (asset) layers.push(asset);
    else missingLayers.push(id);
  }
  if (missingLayers.length > 0) return { status: "missing", visualId, slug, signature, missingLayers };
  return { status: "approved", visualId, slug, signature, layers };
}

export interface VisualCache {
  resolve(recipe: VisualRecipe): VisualResolution;
  readonly size: number;
}

/** Bounded LRU keyed only by the visible signature. */
export function createVisualCache(
  limit = 48,
  registry: VisualRegistry = DEFAULT_VISUAL_REGISTRY,
): VisualCache {
  const entries = new Map<string, VisualResolution>();
  return {
    resolve(recipe) {
      const key = visibleSignature(recipe);
      const hit = entries.get(key);
      if (hit) {
        entries.delete(key);
        entries.set(key, hit);
        return hit;
      }
      const value = resolveVisual(recipe, registry);
      entries.set(key, value);
      if (entries.size > limit) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
      return value;
    },
    get size() {
      return entries.size;
    },
  };
}

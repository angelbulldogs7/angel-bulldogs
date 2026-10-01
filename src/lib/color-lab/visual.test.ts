import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getLocus } from "../../data/color-lab/loci";
import { baselineDogState, presetState, withBigRope } from "./dogState";
import { baselineGenotype } from "./genotype";
import { buildVisualManifest, serializeManifest } from "./manifest";
import {
  completeProfile,
  locusContribution,
  resolveDog,
  resolvePhenotype,
  resolveProfile,
  type ProfileContribution,
} from "./phenotypeResolver";
import type { ApprovedAsset, Genotype, LocusId, PhenotypeResult, VisiblePhenotype } from "./types";
import { LOCUS_IDS } from "./types";
import { createVisualCache, resolveVisual } from "./visualCache";
import { requiredLayers, visibleSignature, visualSlug } from "./visualRecipe";

function dog(overrides: Partial<Record<LocusId, string>> = {}): Genotype {
  return { ...baselineGenotype(), ...overrides };
}

function visible(result: PhenotypeResult): VisiblePhenotype {
  if (result.kind === "nonviable") throw new Error("Expected a visible phenotype.");
  return result;
}

const asset = (src: string): ApprovedAsset => ({ src, width: 800, height: 1000 });

describe("visual signatures", () => {
  it("deduplicates hidden carriers to one visible signature", () => {
    const plain = visible(resolvePhenotype(dog()));
    const carriers = visible(
      resolvePhenotype(
        dog({
          asip: "ady/a",
          dilute: "D/d",
          cocoa: "Co/co",
          tyrp1: "B/b",
          k: "ky/ky",
          mc1r: "Em/e",
          mitf: "N/S",
          merle: "M/m",
          fgf5: "L/l",
          slc45a2: "N/alb",
        }),
      ),
    );
    assert.equal(visibleSignature(plain.recipe), visibleSignature(carriers.recipe));
  });

  it("excludes confirmation, names, and sex from the signature", () => {
    const a = resolveDog(baselineDogState());
    const b = resolveDog({ ...baselineDogState(), confirmation: "lab-confirmed" });
    assert.equal(visibleSignature(visible(a).recipe), visibleSignature(visible(b).recipe));
    assert.doesNotMatch(visibleSignature(visible(a).recipe), /Fawn|assumed|male|female/);
  });

  it("changes only the visual recipe and name when Big Rope is on", () => {
    const off = baselineDogState();
    const on = withBigRope(off, true);
    assert.deepEqual(on.genotype, off.genotype);
    const offResult = visible(resolveDog(off));
    const onResult = visible(resolveDog(on));
    assert.equal(onResult.recipe.bigRope, true);
    assert.deepEqual({ ...onResult.recipe, bigRope: false }, offResult.recipe);
    assert.deepEqual(onResult.profile, offResult.profile);
    assert.ok(requiredLayers(onResult.recipe).includes("big-rope/standard"));
  });
});

describe("automatic eyes", () => {
  it("follows Pink → visible Merle → dark brown", () => {
    assert.equal(visible(resolvePhenotype(dog({ slc45a2: "alb/alb", k: "KB/KB", merle: "M/m" }))).recipe.eyes, "light-blue");
    assert.equal(visible(resolvePhenotype(dog({ k: "KB/KB", merle: "M/m" }))).recipe.eyes, "blue");
    assert.equal(visible(resolvePhenotype(dog({ merle: "M/m" }))).recipe.eyes, "dark-brown");
    assert.equal(visible(resolvePhenotype(dog({ intensity: "In/In" }))).recipe.eyes, "dark-brown");
    assert.equal(visible(resolvePhenotype(dog({ intensity: "In/In", k: "kbr/kbr", merle: "M/m" }))).recipe.eyes, "blue");
    assert.equal(visible(resolvePhenotype(dog())).recipe.eyes, "dark-brown");
  });
});

describe("visual registry", () => {
  it("shows Image coming soon when any required layer is missing", () => {
    const recipe = visible(resolveDog(baselineDogState())).recipe;
    const none = resolveVisual(recipe, { layers: {}, derivatives: {} });
    assert.equal(none.status, "missing");
    const partial = resolveVisual(recipe, {
      layers: { "anchor/standard": asset("/a.webp"), "coat/standard/fawn": asset("/b.webp") },
      derivatives: {},
    });
    assert.equal(partial.status, "missing");
    if (partial.status === "missing") assert.deepEqual(partial.missingLayers, ["mask/standard/black"]);
  });

  it("never substitutes a nearby color or pattern", () => {
    const blueFawn = visible(resolvePhenotype(dog({ dilute: "d/d" }))).recipe;
    const registry = {
      layers: {
        "anchor/standard": asset("/anchor.webp"),
        "coat/standard/fawn": asset("/fawn.webp"),
        "mask/standard/black": asset("/mask-black.webp"),
      },
      derivatives: { "fawn-solid-masked": asset("/fawn-derivative.webp") },
    };
    const resolution = resolveVisual(blueFawn, registry);
    assert.equal(resolution.status, "missing");
    if (resolution.status === "missing") {
      assert.deepEqual(resolution.missingLayers, ["coat/standard/blue-fawn", "mask/standard/blue"]);
    }
  });

  it("stacks approved layers bottom to top, or uses an approved derivative", () => {
    const recipe = visible(resolveDog(baselineDogState())).recipe;
    const layered = resolveVisual(recipe, {
      layers: {
        "anchor/standard": asset("/anchor.webp"),
        "coat/standard/fawn": asset("/fawn.webp"),
        "mask/standard/black": asset("/mask.webp"),
      },
      derivatives: {},
    });
    assert.equal(layered.status, "approved");
    if (layered.status === "approved") {
      assert.deepEqual(
        layered.layers.map((layer) => layer.src),
        ["/anchor.webp", "/fawn.webp", "/mask.webp"],
      );
    }
    const derived = resolveVisual(recipe, { layers: {}, derivatives: { [visualSlug(recipe)]: asset("/master.webp") } });
    assert.equal(derived.status, "approved");
  });

  it("gives Solid recipes no white-marking layer", () => {
    for (const preset of ["fawn", "black", "lilac", "cream", "platinum", "pink", "sable", "fawn-hairless"]) {
      const state = presetState(preset);
      assert.ok(state);
      const result = visible(resolveDog(state));
      assert.equal(result.tokens.solid, true, preset);
      assert.equal(result.recipe.pied, false, preset);
      assert.ok(!requiredLayers(result.recipe).some((layer) => layer.startsWith("pied/")), preset);
    }
    const pied = presetState("fawn-pied");
    assert.ok(pied);
    assert.ok(requiredLayers(visible(resolveDog(pied)).recipe).includes("pied/standard"));
  });

  it("caches by visible signature with a bounded size", () => {
    const cache = createVisualCache(2, { layers: {}, derivatives: {} });
    const fawn = visible(resolvePhenotype(dog())).recipe;
    const blue = visible(resolvePhenotype(dog({ dilute: "d/d" }))).recipe;
    const black = visible(resolvePhenotype(dog({ k: "KB/KB" }))).recipe;
    const first = cache.resolve(fawn);
    assert.equal(cache.resolve({ ...fawn }), first);
    cache.resolve(blue);
    cache.resolve(black);
    assert.equal(cache.size, 2);
  });
});

describe("visual manifest", () => {
  const manifest = buildVisualManifest();

  it("counts every deduplicated visible recipe exactly once", () => {
    const expected = new Set<string>();
    const visit = (depth: number, partial: ProfileContribution): void => {
      if (depth === LOCUS_IDS.length) {
        const profile = completeProfile(partial);
        for (const bigRope of [false, true]) {
          const result = resolveProfile(profile, { bigRope });
          if (result.kind === "viable") expected.add(visibleSignature(result.recipe));
        }
        return;
      }
      const locus = LOCUS_IDS[depth];
      const seen = new Set<string>();
      for (const option of getLocus(locus).options) {
        if (!option.selectable) continue;
        const contribution = locusContribution(locus, option.id);
        const key = JSON.stringify(contribution);
        if (seen.has(key)) continue;
        seen.add(key);
        visit(depth + 1, { ...partial, ...contribution });
      }
    };
    visit(0, {});
    const signatures = new Set(manifest.recipes.map((recipe) => recipe.visibleSignature));
    assert.deepEqual(signatures, expected);
    assert.equal(signatures.size, manifest.recipes.length);
    assert.equal(new Set(manifest.recipes.map((recipe) => recipe.visualId)).size, manifest.recipes.length);
    assert.equal(new Set(manifest.recipes.map((recipe) => recipe.slug)).size, manifest.recipes.length);
    assert.equal(manifest.counts.visualRecipes, manifest.recipes.length);
  });

  it("marks every recipe missing until images are approved", () => {
    assert.equal(manifest.counts.approvedRecipes, 0);
    assert.ok(manifest.recipes.every((recipe) => recipe.status === "missing" && recipe.derivative === null));
    assert.ok(manifest.recipes.every((recipe) => recipe.alt.startsWith("Image coming soon")));
  });

  it("is deterministic and matches the committed manifest file", () => {
    assert.equal(serializeManifest(buildVisualManifest()), serializeManifest(manifest));
    const committed = readFileSync(
      join(import.meta.dirname, "..", "..", "..", "frenchie-color-lab-image-library", "manifest", "visual-manifest.v2.json"),
      "utf8",
    );
    assert.equal(committed, serializeManifest(manifest), "Run `npm run color-lab:manifest` to refresh the manifest.");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRESETS, PRESET_GROUPS, QUICK_PRESET_IDS, quickPresets } from "../../data/color-lab/presets";
import { baselineDogState, presetState, withBigRope, withConfirmation, withLocus } from "./dogState";
import { baselineGenotype } from "./genotype";
import { resolveDog } from "./phenotypeResolver";
import type { DogState, LocusId } from "./types";
import { LOCUS_IDS } from "./types";

const EXPECTED: Record<string, string> = {
  fawn: "Fawn Solid",
  cream: "Cream Solid",
  lilac: "Lilac Solid",
  "new-shade-isabella": "New Shade Isabella Solid",
  "new-shade-rojo": "New Shade Rojo Solid",
  platinum: "Platinum Solid",
  "fawn-pied": "Fawn Pied",
  "new-shade-isabella-fluffy": "New Shade Isabella Solid Fluffy",
  pink: "Pink Solid",
  black: "Black Solid",
  chocolate: "Chocolate Solid",
  cocoa: "Cocoa Solid",
  blue: "Blue Solid",
  isabella: "Isabella Solid",
  "platinum-new-shade-isabella": "Platinum New Shade Isabella Solid",
  "cream-white-intensity": "Cream/White Solid",
  sable: "Sable Solid",
  "black-and-tan": "Black And Tan",
  "fawn-brindle": "Fawn Brindle",
  "black-merle": "Black Merle",
  "blue-merle": "Blue Merle",
  husky: "Black Husky",
  "fawn-hairless": "Hairless Fawn Solid",
  "fawn-big-rope": "Fawn Solid Big Rope",
};

/** A dog full of carriers and a lab confirmation, so leftovers would be obvious. */
function messyDog(): DogState {
  let state = baselineDogState();
  const edits: [LocusId, string][] = [
    ["asip", "asy/a"],
    ["dilute", "D/d"],
    ["cocoa", "Co/co"],
    ["tyrp1", "B/b"],
    ["k", "KB/kbr"],
    ["mc1r", "E/e"],
    ["mitf", "N/S"],
    ["merle", "M/m"],
    ["fgf5", "L/l"],
    ["intensity", "N/In"],
    ["slc45a2", "N/alb"],
    ["foxi3", "N/Dup"],
  ];
  for (const [locus, option] of edits) state = withLocus(state, locus, option);
  return withConfirmation(withBigRope(state, true), "lab-confirmed");
}

describe("presets", () => {
  it("shows exactly nine quick presets in the approved order", () => {
    assert.deepEqual(
      quickPresets().map((item) => item.label),
      [
        "Fawn",
        "Cream",
        "Lilac",
        "New Shade Isabella",
        "New Shade Rojo",
        "Platinum",
        "Fawn Pied",
        "New Shade Isabella Fluffy",
        "Pink",
      ],
    );
  });

  it("lists 24 View All presets in the three scanning groups", () => {
    assert.equal(PRESETS.length, 24);
    assert.equal(new Set(PRESETS.map((item) => item.id)).size, 24);
    for (const id of QUICK_PRESET_IDS) assert.ok(PRESETS.some((item) => item.id === id), id);
    assert.deepEqual(
      PRESET_GROUPS.map((group) => group.title),
      ["Core Colors", "Patterns", "Coat & Rare Traits"],
    );
  });

  it("resets every locus, Big Rope, and confirmation, then resolves deterministically", () => {
    for (const item of PRESETS) {
      const applied = presetState(item.id);
      assert.ok(applied, item.id);
      const expectedGenotype = { ...baselineGenotype(), ...item.overrides };
      assert.deepEqual(applied.genotype, expectedGenotype, item.id);
      assert.equal(applied.bigRope, item.bigRope, item.id);
      assert.equal(applied.confirmation, "assumed", item.id);
      const first = resolveDog(applied);
      const second = resolveDog(presetState(item.id) ?? applied);
      assert.equal(first.publicName, EXPECTED[item.id], item.id);
      assert.deepEqual(first, second, item.id);
    }
  });

  it("never leaves carriers from the previous dog", () => {
    const before = messyDog();
    assert.equal(before.confirmation, "lab-confirmed");
    const cream = presetState("cream");
    assert.ok(cream);
    for (const locus of LOCUS_IDS) {
      const expected = locus === "mc1r" ? "e/e" : baselineGenotype()[locus];
      assert.equal(cream.genotype[locus], expected, locus);
    }
    assert.equal(cream.bigRope, false);
    assert.equal(cream.confirmation, "assumed");
  });

  it("matches the canonical preset DNA table", () => {
    const overrides = Object.fromEntries(PRESETS.map((item) => [item.id, item.overrides]));
    assert.deepEqual(overrides["husky"], {
      asip: "abb/abb",
      k: "ky/ky",
      mc1r: "eA/eA",
      tyrp1: "B/B",
      cocoa: "Co/Co",
      dilute: "D/D",
    });
    assert.deepEqual(overrides["platinum"], { mc1r: "e/e", dilute: "d/d", cocoa: "co/co", tyrp1: "B/B" });
    assert.deepEqual(overrides["cream-white-intensity"], { intensity: "In/In" });
    assert.deepEqual(overrides["fawn-hairless"], { foxi3: "N/Dup" });
    assert.equal(PRESETS.find((item) => item.id === "fawn-big-rope")?.bigRope, true);
  });
});

describe("lab confirmation", () => {
  it("clears on any genotype edit", () => {
    const confirmed = withConfirmation(baselineDogState(), "lab-confirmed");
    assert.equal(withLocus(confirmed, "dilute", "D/d").confirmation, "assumed");
  });

  it("does not change when the same genotype is re-selected", () => {
    const confirmed = withConfirmation(baselineDogState(), "lab-confirmed");
    assert.equal(withLocus(confirmed, "dilute", "D/D").confirmation, "lab-confirmed");
  });

  it("clears on every preset application", () => {
    for (const item of PRESETS) assert.equal(presetState(item.id)?.confirmation, "assumed", item.id);
  });

  it("is unaffected by the Big Rope visual toggle", () => {
    const confirmed = withConfirmation(baselineDogState(), "lab-confirmed");
    assert.equal(withBigRope(confirmed, true).confirmation, "lab-confirmed");
  });

  it("rejects conception-only genotypes as edits", () => {
    assert.throws(() => withLocus(baselineDogState(), "foxi3", "Dup/Dup"));
  });
});

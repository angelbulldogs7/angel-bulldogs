import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { ALLELE_ALIASES } from "../../data/color-lab/alleleAliases";
import { LOCI, SECTIONS, getLocus } from "../../data/color-lab/loci";
import { PRESETS } from "../../data/color-lab/presets";
import { MODEL_LIMITATIONS } from "../../data/color-lab/sources";
import { baselineDogState } from "./dogState";
import { baselineGenotype, canonicalOptionId, displayGenotype, isSelectableOption, optionText } from "./genotype";
import { resolveDog } from "./phenotypeResolver";
import { LOCUS_IDS } from "./types";

describe("controls and defaults", () => {
  it("prefills every active locus with a valid, selectable genotype", () => {
    const genotype = baselineGenotype();
    for (const locus of LOCUS_IDS) {
      assert.equal(isSelectableOption(locus, genotype[locus]), true, locus);
    }
  });

  it("uses the exact Masked Classic Fawn baseline", () => {
    assert.deepEqual(baselineGenotype(), {
      asip: "ady/ady",
      dilute: "D/D",
      cocoa: "Co/Co",
      tyrp1: "B/B",
      k: "ky/ky",
      mc1r: "Em/E",
      mitf: "N/N",
      merle: "m/m",
      fgf5: "L/L",
      intensity: "N/N",
      slc45a2: "N/N",
      foxi3: "N/N",
    });
    const state = baselineDogState();
    assert.equal(state.bigRope, false);
    assert.equal(state.confirmation, "assumed");
  });

  it("resolves the baseline to Fawn Solid with Masked only in DNA details", () => {
    const result = resolveDog(baselineDogState());
    assert.equal(result.kind, "viable");
    if (result.kind === "nonviable") return;
    assert.equal(result.publicName, "Fawn Solid");
    assert.equal(result.recipe.mask, true);
    assert.ok(result.masked.includes("mask-detail"));
  });

  it("has no unknown or untested state anywhere in the catalog", () => {
    for (const locus of LOCI) {
      for (const option of locus.options) {
        assert.doesNotMatch(option.label, /unknown|untested|not tested/i);
        assert.equal(option.alleles.length, 2);
      }
    }
  });

  it("offers every unordered pair exactly once, in canonical order", () => {
    for (const locus of LOCI) {
      const expected = (locus.alleles.length * (locus.alleles.length + 1)) / 2;
      assert.equal(locus.options.length, expected, locus.id);
      for (const option of locus.options) {
        assert.equal(canonicalOptionId(locus.id, option.alleles[1], option.alleles[0]), option.id);
      }
    }
  });

  it("uses exactly the three approved sections in order", () => {
    assert.deepEqual(
      SECTIONS.map((section) => [section.title, section.loci]),
      [
        ["Color", ["asip", "dilute", "cocoa", "tyrp1"]],
        ["Patterns", ["k", "mc1r", "mitf", "merle"]],
        ["Coat & Rare Traits", ["fgf5", "intensity", "slc45a2", "foxi3"]],
      ],
    );
  });

  it("offers the exact simplified genotype choices", () => {
    const choices = Object.fromEntries(
      LOCUS_IDS.map((locus) => [
        locus,
        getLocus(locus)
          .options.filter((option) => option.selectable)
          .map((option) => optionText(locus, option.id)),
      ]),
    );
    assert.deepEqual(choices.asip, [
      "Fawn — Aᴰʸ/Aᴰʸ",
      "Fawn, carries Sable — Aᴰʸ/Aˢʸ",
      "Fawn, carries And Tan — Aᴰʸ/Aᴮᴮ",
      "Fawn, carries Recessive Black — Aᴰʸ/a",
      "Sable — Aˢʸ/Aˢʸ",
      "Sable, carries And Tan — Aˢʸ/Aᴮᴮ",
      "Sable, carries Recessive Black — Aˢʸ/a",
      "And Tan — Aᴮᴮ/Aᴮᴮ",
      "And Tan, carries Recessive Black — Aᴮᴮ/a",
      "Recessive Black — a/a",
    ]);
    assert.deepEqual(choices.dilute, ["Clear — D/D", "Carries Dilute — D/d", "Dilute — d/d"]);
    assert.deepEqual(choices.cocoa, ["Clear — Co/Co", "Carries Cocoa — Co/co", "Cocoa — co/co"]);
    assert.deepEqual(choices.tyrp1, ["Clear — B/B", "Carries Brown — B/b", "Brown — b/b"]);
    assert.deepEqual(choices.k, [
      "Dominant Black — Kᴮ/Kᴮ",
      "Dominant Black, carries Brindle — Kᴮ/kᵇʳ",
      "Dominant Black, carries Agouti expression — Kᴮ/kʸ",
      "Brindle — kᵇʳ/kᵇʳ",
      "Brindle, carries Agouti expression — kᵇʳ/kʸ",
      "Allows Agouti — kʸ/kʸ",
    ]);
    assert.deepEqual(choices.mc1r, [
      "Masked extension — Eᴹ/Eᴹ",
      "Masked extension — Eᴹ/E",
      "Masked extension, carries Husky — Eᴹ/eᴬ",
      "Masked extension, carries Cream — Eᴹ/e",
      "Normal extension — E/E",
      "Normal extension, carries Husky — E/eᴬ",
      "Normal extension, carries Cream — E/e",
      "Husky-capable — eᴬ/eᴬ",
      "Husky-capable, carries Cream — eᴬ/e",
      "Cream / recessive red — e/e",
    ]);
    assert.deepEqual(choices.mitf, ["Not Pied — N/N", "Carries Pied — N/S", "Pied — S/S"]);
    assert.deepEqual(choices.merle, ["Not Merle — m/m", "Merle — M/m", "Double Merle — M/M"]);
    assert.deepEqual(choices.fgf5, ["Standard Coat — L/L", "Carries Fluffy — L/l", "Fluffy — l/l"]);
    assert.deepEqual(choices.intensity, [
      "Clear — N/N",
      "Carries Intensity Dilution — N/In",
      "Intensity Dilution — In/In",
    ]);
    assert.deepEqual(choices.slc45a2, ["Not Pink — N/N", "Carries Pink — N/alb", "Pink — alb/alb"]);
    assert.deepEqual(choices.foxi3, ["Coated — N/N", "Hairless — N/Dup"]);
  });

  it("never offers Dup/Dup as a living Stud or Dam genotype", () => {
    assert.equal(isSelectableOption("foxi3", "Dup/Dup"), false);
    assert.equal(displayGenotype("foxi3", "Dup/Dup"), "Dup/Dup");
  });
});

describe("removed features stay removed", () => {
  const removedLoci = ["krt71", "rspo2"];

  it("keeps Curl and Furnishings out of every active schema", () => {
    for (const id of removedLoci) {
      assert.equal((LOCUS_IDS as readonly string[]).includes(id), false);
      assert.equal(Object.hasOwn(ALLELE_ALIASES, id), false);
      for (const item of PRESETS) assert.equal(Object.hasOwn(item.overrides, id), false);
    }
  });

  it("never shows lab sub-variants such as d1–d3, bs/bd/bc, or L1–L5 in visible copy", () => {
    const visible = [
      ...LOCI.flatMap((locus) => [locus.name, locus.help ?? "", ...locus.options.map((option) => option.label)]),
      ...MODEL_LIMITATIONS,
    ];
    for (const text of visible) assert.doesNotMatch(text, /\b(d[123]|b[sdc]|L[1-5])\b/, text);
  });

  it("keeps removed controls out of Color Lab components, scripts, and styles", () => {
    const root = join(import.meta.dirname, "..", "..");
    const files = [
      ...readdirSync(join(root, "components", "color-lab")).map((file) => join(root, "components", "color-lab", file)),
      ...readdirSync(join(root, "scripts", "color-lab")).map((file) => join(root, "scripts", "color-lab", file)),
      join(root, "styles", "color-lab.css"),
      join(root, "pages", "color-lab.astro"),
    ];
    const banned =
      /\b(guided|advanced mode|data-mode|krt71|rspo2|curl|furnish\w*|eye (color )?selector|shade level|brindle density|d1|d2|d3|L4)\b/i;
    for (const file of files) {
      assert.doesNotMatch(readFileSync(file, "utf8"), banned, file);
    }
  });
});

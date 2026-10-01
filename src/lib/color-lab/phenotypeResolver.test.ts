import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLocus } from "../../data/color-lab/loci";
import { baselineGenotype } from "./genotype";
import { calculateLitter } from "./inheritance";
import { resolvePhenotype } from "./phenotypeResolver";
import type { Genotype, LocusId, PhenotypeResult, VisiblePhenotype } from "./types";
import { visibleSignature } from "./visualRecipe";

function dog(overrides: Partial<Record<LocusId, string>> = {}): Genotype {
  return { ...baselineGenotype(), ...overrides };
}

function visible(result: PhenotypeResult): VisiblePhenotype {
  if (result.kind === "nonviable") throw new Error("Expected a visible phenotype.");
  return result;
}

function name(overrides: Partial<Record<LocusId, string>>, bigRope = false): string {
  return resolvePhenotype(dog(overrides), { bigRope }).publicName;
}

describe("K locus and Agouti", () => {
  it("resolves K before Agouti visibility", () => {
    assert.equal(name({}), "Fawn Solid");
    assert.equal(name({ k: "KB/ky" }), "Black Solid");
    assert.equal(name({ k: "kbr/ky" }), "Fawn Brindle");
    const black = visible(resolvePhenotype(dog({ k: "KB/kbr" })));
    assert.equal(black.publicName, "Black Solid");
    assert.ok(black.masked.includes("agouti-hidden-by-dominant-black"));
  });

  it("uses the four simplified Agouti classes with Aᴰʸ > Aˢʸ > Aᴮᴮ > a", () => {
    assert.equal(name({ asip: "ady/a" }), "Fawn Solid");
    assert.equal(name({ asip: "asy/abb" }), "Sable Solid");
    assert.equal(name({ asip: "abb/a", mc1r: "E/E" }), "Black And Tan");
    assert.equal(name({ asip: "a/a" }), "Black Solid");
    assert.deepEqual(
      getLocus("asip").options.map((option) => option.label),
      [
        "Fawn",
        "Fawn, carries Sable",
        "Fawn, carries And Tan",
        "Fawn, carries Recessive Black",
        "Sable",
        "Sable, carries And Tan",
        "Sable, carries Recessive Black",
        "And Tan",
        "And Tan, carries Recessive Black",
        "Recessive Black",
      ],
    );
  });

  it("shares one Black Solid recipe for Dominant and Recessive Black, with different DNA", () => {
    const dominant = visible(resolvePhenotype(dog({ k: "KB/KB", asip: "ady/ady" })));
    const recessive = visible(resolvePhenotype(dog({ k: "ky/ky", asip: "a/a" })));
    assert.equal(dominant.publicName, "Black Solid");
    assert.equal(recessive.publicName, "Black Solid");
    assert.equal(visibleSignature(dominant.recipe), visibleSignature(recessive.recipe));
    assert.notDeepEqual(dog({ k: "KB/KB" }), dog({ asip: "a/a" }));
  });
});

describe("E locus, mask, and Husky", () => {
  it("applies Eᴹ > E > eᴬ > e and keeps the mask out of the name", () => {
    const masked = visible(resolvePhenotype(dog({ mc1r: "Em/e" })));
    const plain = visible(resolvePhenotype(dog({ mc1r: "E/e" })));
    assert.equal(masked.publicName, "Fawn Solid");
    assert.equal(plain.publicName, "Fawn Solid");
    assert.equal(masked.recipe.mask, true);
    assert.equal(plain.recipe.mask, false);
    assert.equal(name({ mc1r: "e/e" }), "Cream Solid");
    for (const option of getLocus("mc1r").options) {
      for (const k of ["KB/KB", "kbr/ky", "ky/ky"]) {
        assert.doesNotMatch(name({ mc1r: option.id, k }), /mask/i);
      }
    }
  });

  it("shows Husky only with eᴬ/eᴬ or eᴬ/e, kʸ/kʸ, and And Tan", () => {
    for (const e of ["eA/eA", "eA/e"]) {
      for (const asip of ["abb/abb", "abb/a"]) {
        assert.equal(name({ mc1r: e, k: "ky/ky", asip }), "Black Husky");
      }
    }
    assert.equal(name({ mc1r: "eA/eA", k: "ky/ky", asip: "abb/abb", dilute: "d/d" }), "Blue Husky");
    assert.equal(name({ mc1r: "E/eA", k: "ky/ky", asip: "abb/abb" }), "Black And Tan");
  });

  it("keeps incompatible eᴬ in DNA details only", () => {
    const fawn = visible(resolvePhenotype(dog({ mc1r: "eA/eA" })));
    assert.equal(fawn.publicName, "Fawn Solid");
    assert.ok(fawn.masked.includes("husky-needs-ky-and-tan"));
    assert.equal(name({ mc1r: "eA/eA", k: "kbr/kbr", asip: "abb/abb" }), "Black And Tan Brindle");
    const dominant = visible(resolvePhenotype(dog({ mc1r: "eA/e", k: "KB/KB", asip: "abb/abb" })));
    assert.equal(dominant.publicName, "Black Solid");
    assert.ok(dominant.masked.includes("ea-with-dominant-black"));
  });

  it("masks patterns on e/e while keeping the DNA", () => {
    const genotype = dog({ mc1r: "e/e", k: "kbr/kbr", merle: "M/m", asip: "abb/abb" });
    const cream = visible(resolvePhenotype(genotype));
    assert.equal(cream.publicName, "Cream Solid");
    assert.ok(cream.masked.includes("pattern-hidden-by-cream"));
    assert.ok(cream.masked.includes("merle-hidden"));
    assert.equal(genotype.k, "kbr/kbr");
    assert.equal(genotype.merle, "M/m");
  });
});

describe("pigment names and masking", () => {
  it("names all eight core pigments from expressed Brown, Cocoa, and Dilute", () => {
    const table: [string, string, string, string][] = [
      ["B/B", "Co/Co", "D/D", "Black Solid"],
      ["b/b", "Co/Co", "D/D", "Chocolate Solid"],
      ["B/B", "co/co", "D/D", "Cocoa Solid"],
      ["b/b", "co/co", "D/D", "New Shade Rojo Solid"],
      ["B/B", "Co/Co", "d/d", "Blue Solid"],
      ["b/b", "Co/Co", "d/d", "Isabella Solid"],
      ["B/B", "co/co", "d/d", "Lilac Solid"],
      ["b/b", "co/co", "d/d", "New Shade Isabella Solid"],
    ];
    for (const [tyrp1, cocoa, dilute, expected] of table) {
      assert.equal(name({ k: "KB/KB", tyrp1, cocoa, dilute }), expected);
    }
  });

  it("ignores carriers when naming pigment", () => {
    assert.equal(name({ k: "KB/KB", tyrp1: "B/b", cocoa: "Co/co", dilute: "D/d" }), "Black Solid");
  });

  it("lets Pink outrank Cream, Platinum, and ordinary color", () => {
    assert.equal(name({ slc45a2: "alb/alb" }), "Pink Solid");
    assert.equal(name({ slc45a2: "alb/alb", mc1r: "e/e", dilute: "d/d", cocoa: "co/co" }), "Pink Solid");
    const pink = visible(resolvePhenotype(dog({ slc45a2: "alb/alb", k: "KB/KB", merle: "M/m", mitf: "S/S" })));
    assert.equal(pink.publicName, "Pink Solid");
    assert.equal(pink.recipe.pigment, null);
    assert.equal(pink.recipe.merle, false);
    assert.equal(pink.recipe.pied, false);
    assert.ok(pink.masked.includes("color-hidden-by-pink"));
  });

  it("applies the exact Platinum rules", () => {
    const ee = { mc1r: "e/e", dilute: "d/d", cocoa: "co/co" };
    assert.equal(name({ ...ee, tyrp1: "B/B" }), "Platinum Solid");
    assert.equal(name({ ...ee, tyrp1: "B/b" }), "Platinum Solid");
    assert.equal(name({ ...ee, tyrp1: "b/b" }), "Platinum New Shade Isabella Solid");
    assert.equal(name({ mc1r: "e/e", dilute: "d/d" }), "Cream Solid");
    assert.equal(name({ mc1r: "e/e", cocoa: "co/co" }), "Cream Solid");
    assert.equal(name({ mc1r: "e/e", tyrp1: "b/b", cocoa: "co/co" }), "Cream Solid");
    const platinum = visible(resolvePhenotype(dog({ ...ee, tyrp1: "B/B" })));
    const nsi = visible(resolvePhenotype(dog({ ...ee, tyrp1: "b/b" })));
    assert.equal(visibleSignature(platinum.recipe), visibleSignature(nsi.recipe));
  });

  it("uses In/In on visible phaeomelanin only", () => {
    const creamWhite = visible(resolvePhenotype(dog({ intensity: "In/In" })));
    assert.equal(creamWhite.publicName, "Cream/White Solid");
    assert.equal(creamWhite.subtitle, "Intensity Dilution");
    assert.equal(creamWhite.recipe.eyes, "dark-brown");
    const black = visible(resolvePhenotype(dog({ intensity: "In/In", k: "KB/KB" })));
    assert.equal(black.publicName, "Black Solid");
    assert.equal(black.subtitle, null);
    assert.ok(black.masked.includes("intensity-no-phaeomelanin"));
    assert.equal(name({ intensity: "In/In", mc1r: "e/e" }), "Cream Solid");
    assert.equal(name({ intensity: "In/In", asip: "abb/abb", mc1r: "E/E" }), "Black And Tan");
  });

  it("always includes Solid when no visible pattern remains", () => {
    assert.equal(name({ merle: "M/m" }), "Fawn Solid");
    assert.equal(name({ mitf: "S/S", mc1r: "e/e" }), "Cream Solid");
    assert.equal(name({ k: "kbr/kbr", asip: "a/a" }), "Black Solid");
    assert.equal(name({ foxi3: "N/Dup", fgf5: "l/l" }), "Hairless Fawn Solid");
  });

  it("puts Hairless first and hides Fluffy visually without deleting it", () => {
    const genotype = dog({ foxi3: "N/Dup", fgf5: "l/l" });
    const result = visible(resolvePhenotype(genotype));
    assert.equal(result.publicName, "Hairless Fawn Solid");
    assert.equal(result.recipe.base, "hairless");
    assert.ok(result.masked.includes("fluffy-hidden-by-hairless"));
    assert.equal(genotype.fgf5, "l/l");
    assert.equal(name({ fgf5: "l/l" }), "Fawn Solid Fluffy");
  });

  it("keeps hidden Merle in the Genotypes tab", () => {
    const result = calculateLitter(dog({ mc1r: "e/e", merle: "M/m" }), dog({ mc1r: "e/e" }));
    assert.deepEqual(
      result.groups.map((group) => group.result.publicName),
      ["Cream Solid"],
    );
    const merle = result.loci.find((item) => item.locus === "merle");
    assert.deepEqual(
      merle?.rows.map((row) => [row.option, row.percent]),
      [
        ["m/m", "50.00"],
        ["M/m", "50.00"],
      ],
    );
  });

  it("flags masked M/M as concerning even when Merle is invisible", () => {
    const hidden = resolvePhenotype(dog({ mc1r: "e/e", merle: "M/M" }));
    assert.equal(hidden.kind, "concerning");
    assert.equal(hidden.publicName, "Cream Solid");
    const shown = resolvePhenotype(dog({ k: "KB/KB", merle: "M/M" }));
    assert.equal(shown.kind, "concerning");
    assert.equal(shown.publicName, "Black Double Merle");
  });
});

describe("public-name grammar", () => {
  const snapshot: [string, Partial<Record<LocusId, string>>, boolean, string][] = [
    ["baseline", {}, false, "Fawn Solid"],
    ["sable", { asip: "asy/asy" }, false, "Sable Solid"],
    ["black and tan", { asip: "abb/abb", mc1r: "E/E" }, false, "Black And Tan"],
    ["blue brindle merle pied", { k: "kbr/kbr", dilute: "d/d", merle: "M/m", mitf: "S/S" }, false, "Blue Brindle Merle Pied"],
    [
      "new shade isabella fluffy",
      { k: "KB/KB", tyrp1: "b/b", cocoa: "co/co", dilute: "d/d", fgf5: "l/l" },
      false,
      "New Shade Isabella Solid Fluffy",
    ],
    ["platinum", { mc1r: "e/e", dilute: "d/d", cocoa: "co/co" }, false, "Platinum Solid"],
    [
      "platinum new shade isabella",
      { mc1r: "e/e", dilute: "d/d", cocoa: "co/co", tyrp1: "b/b" },
      false,
      "Platinum New Shade Isabella Solid",
    ],
    ["pink", { slc45a2: "alb/alb" }, false, "Pink Solid"],
    ["hairless fawn", { foxi3: "N/Dup" }, false, "Hairless Fawn Solid"],
    [
      "hairless new shade rojo and tan big rope",
      { foxi3: "N/Dup", asip: "abb/abb", tyrp1: "b/b", cocoa: "co/co" },
      true,
      "Hairless New Shade Rojo And Tan Big Rope",
    ],
    ["blue fawn", { dilute: "d/d" }, false, "Blue Fawn Solid"],
    ["lilac sable", { asip: "asy/asy", cocoa: "co/co", dilute: "d/d" }, false, "Lilac Sable Solid"],
    ["and tan brindle merle pied", { asip: "abb/abb", k: "kbr/ky", merle: "M/m", mitf: "S/S" }, false, "Black And Tan Brindle Merle Pied"],
    ["husky pied fluffy", { asip: "abb/a", mc1r: "eA/e", mitf: "S/S", fgf5: "l/l" }, false, "Black Husky Pied Fluffy"],
    ["cream white brindle merle", { intensity: "In/In", k: "kbr/kbr", merle: "M/m" }, false, "Cream/White Brindle Merle"],
    ["chocolate merle big rope", { k: "KB/KB", tyrp1: "b/b", merle: "M/m" }, true, "Chocolate Merle Big Rope"],
    ["hairless pink fluffy", { slc45a2: "alb/alb", foxi3: "N/Dup", fgf5: "l/l" }, false, "Hairless Pink Solid"],
  ];

  for (const [label, overrides, bigRope, expected] of snapshot) {
    it(`names ${label}`, () => {
      assert.equal(name(overrides, bigRope), expected);
    });
  }

  it("orders compound names Hairless → Color → And Tan → Brindle → Merle → Pied → Fluffy → Big Rope", () => {
    const full = name(
      { foxi3: "N/Dup", asip: "abb/abb", k: "kbr/ky", merle: "M/m", mitf: "S/S", dilute: "d/d" },
      true,
    );
    assert.equal(full, "Hairless Blue And Tan Brindle Merle Pied Big Rope");
    assert.equal(name({ fgf5: "l/l", k: "kbr/kbr", mitf: "S/S" }, true), "Fawn Brindle Pied Fluffy Big Rope");
  });

  it("adds Tricolor only as a secondary alias for visible And Tan with Pied", () => {
    const tricolor = visible(resolvePhenotype(dog({ asip: "abb/abb", mc1r: "E/E", mitf: "S/S" })));
    assert.equal(tricolor.publicName, "Black And Tan Pied");
    assert.deepEqual(tricolor.aliases, ["Tricolor"]);
    assert.deepEqual(visible(resolvePhenotype(dog({ mitf: "S/S" }))).aliases, []);
  });

  it("never says Tan Points", () => {
    assert.doesNotMatch(name({ asip: "abb/abb" }), /Tan Points/);
  });
});

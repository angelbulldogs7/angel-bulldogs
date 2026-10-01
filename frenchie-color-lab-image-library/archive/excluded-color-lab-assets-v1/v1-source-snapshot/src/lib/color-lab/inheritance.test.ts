import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultGenotype } from "./genotype";
import { calculateBreeding, punnettSquare } from "./inheritance";
import { displayedPercentsSum } from "./probabilityFormatting";
import type { Genotype } from "./types";

function dog(overrides: Partial<Genotype> = {}): Genotype {
  return { ...defaultGenotype(), ...overrides };
}

function locusPercents(result: ReturnType<typeof calculateBreeding>, locusId: keyof Genotype) {
  const index = [
    "asip",
    "tyrp1",
    "cocoa",
    "dilute",
    "k",
    "mc1r",
    "mitf",
    "merle",
    "intensity",
    "slc45a2",
    "fgf5",
    "foxi3",
    "krt71",
    "rspo2",
  ].indexOf(locusId);
  return result.locusOutcomes[index];
}

describe("inheritance", () => {
  it("homozygous wild-type × wild-type is 100% wild-type", () => {
    const result = calculateBreeding(dog(), dog());
    const cocoa = locusPercents(result, "cocoa");
    assert.equal(cocoa.length, 1);
    assert.equal(cocoa[0].pair[0], "Co");
    assert.equal(cocoa[0].pair[1], "Co");
    assert.equal(cocoa[0].displayPercent, "100.00");
  });

  it("D/d1 × D/d1 is 25/50/25", () => {
    const parent = dog({ dilute: ["D", "d1"] });
    const rows = punnettSquare(parent.dilute, parent.dilute, "dilute");
    const byKey = Object.fromEntries(rows.map((row) => [`${row.pair[0]}/${row.pair[1]}`, row]));
    assert.equal(byKey["D/D"].weight.n, 1n);
    assert.equal(byKey["D/D"].weight.d, 4n);
    assert.equal(byKey["D/d1"].weight.n, 1n);
    assert.equal(byKey["D/d1"].weight.d, 2n);
    assert.equal(byKey["d1/d1"].weight.n, 1n);
    assert.equal(byKey["d1/d1"].weight.d, 4n);
  });

  it("cocoa carrier × cocoa carrier is 25/50/25", () => {
    const parent = dog({ cocoa: ["Co", "co"] });
    const result = calculateBreeding(parent, parent);
    const rows = locusPercents(result, "cocoa");
    const map = Object.fromEntries(rows.map((row) => [`${row.pair[0]}/${row.pair[1]}`, row.displayPercent]));
    assert.equal(map["Co/Co"], "25.00");
    assert.equal(map["Co/co"], "50.00");
    assert.equal(map["co/co"], "25.00");
  });

  it("M/m × M/m is 25/50/25 and flags M/M", () => {
    const parent = dog({ k: ["KB", "KB"], merle: ["M", "m"] });
    const result = calculateBreeding(parent, parent);
    const rows = locusPercents(result, "merle");
    const map = Object.fromEntries(rows.map((row) => [`${row.pair[0]}/${row.pair[1]}`, row.displayPercent]));
    assert.equal(map["m/m"], "25.00");
    assert.equal(map["M/m"], "50.00");
    assert.equal(map["M/M"], "25.00");
    assert.ok(result.pairingFlags.some((flag) => flag.code === "merle-merle-pairing"));
    const double = result.conceptionOutcomes.find((item) => item.phenotype.slug.includes("double-merle"));
    assert.ok(double);
    assert.ok(double.phenotype.safetyFlags.some((flag) => flag.code === "double-merle"));
  });

  it("FGF5 compound LoF combinations express fluffy", () => {
    const sire = dog({ fgf5: ["N", "L4"] });
    const dam = dog({ fgf5: ["N", "L1"] });
    const result = calculateBreeding(sire, dam);
    const fluffy = result.conceptionOutcomes.filter((item) =>
      item.phenotype.expressedTraits.some((trait) => trait.toLowerCase().includes("fluffy")),
    );
    const fluffyShare = fluffy.reduce((sum, item) => sum + item.rawProbability, 0);
    assert.ok(fluffyShare > 0.24 && fluffyShare < 0.26);
    const rows = locusPercents(result, "fgf5");
    const compound = rows.find((row) => row.pair[0] === "L1" && row.pair[1] === "L4");
    assert.equal(compound?.expression, "expressed");
  });

  it("N/Dup × N/Dup labels conception vs viable-only renormalization", () => {
    const parent = dog({ foxi3: ["N", "Dup"] });
    const result = calculateBreeding(parent, parent);
    const fox = locusPercents(result, "foxi3");
    const map = Object.fromEntries(fox.map((row) => [`${row.pair[0]}/${row.pair[1]}`, row]));
    assert.equal(map["N/N"].displayPercent, "25.00");
    assert.equal(map["N/Dup"].displayPercent, "50.00");
    assert.equal(map["Dup/Dup"].displayPercent, "25.00");
    assert.equal(map["Dup/Dup"].expression, "nonviable");
    assert.equal(result.viableRenormalized, true);
    assert.equal(result.nonviableDisplayPercent, "25.00");
    const live = result.conceptionOutcomes.filter((item) => !item.phenotype.nonviable);
    for (const item of live) {
      assert.equal(item.phenotype.nonviable, false);
    }
    assert.ok(!result.viableOutcomes.some((item) => item.phenotype.nonviable));
    assert.equal(
      displayedPercentsSum(result.viableOutcomes.map((item) => item.displayPercent)),
      "100.00",
    );
    const hairlessViable = result.viableOutcomes.find((item) =>
      item.phenotype.expressedTraits.some((trait) => trait.includes("Hairless")),
    );
    const coatedViable = result.viableOutcomes.find(
      (item) => !item.phenotype.expressedTraits.some((trait) => trait.includes("Hairless")),
    );
    assert.equal(hairlessViable?.displayPercent, "66.67");
    assert.equal(coatedViable?.displayPercent, "33.33");
  });

  it("KRT71 dosage: one copy wavy, two copies curly", () => {
    const one = dog({ krt71: ["N", "C1"] });
    const two = dog({ krt71: ["C1", "C2"] });
    const het = calculateBreeding(one, dog());
    const curlyParents = calculateBreeding(two, two);
    const wavy = het.conceptionOutcomes.find((item) =>
      item.phenotype.expressedTraits.some((trait) => trait.includes("Wavy")),
    );
    const curly = curlyParents.conceptionOutcomes.find((item) =>
      item.phenotype.expressedTraits.some((trait) => trait.includes("Curly")),
    );
    assert.ok(wavy);
    assert.ok(curly);
    assert.equal(curly.displayPercent, "100.00");
  });

  it("RSPO2 furnishings is dominant", () => {
    const furnished = dog({ rspo2: ["F", "ic"] });
    const result = calculateBreeding(furnished, dog());
    const withF = result.conceptionOutcomes.filter((item) =>
      item.phenotype.expressedTraits.some((trait) => trait.includes("Furnishings")),
    );
    const share = withF.reduce((sum, item) => sum + item.rawProbability, 0);
    assert.ok(share > 0.49 && share < 0.51);
  });

  it("sorts phenotypes by probability then name, with two-decimal displays", () => {
    const result = calculateBreeding(dog({ cocoa: ["Co", "co"] }), dog({ cocoa: ["Co", "co"] }));
    const percents = result.conceptionOutcomes.map((item) => item.displayPercent);
    for (const percent of percents) assert.match(percent, /^\d+\.\d{2}$/);
    assert.equal(displayedPercentsSum(percents), "100.00");
    for (let i = 1; i < result.conceptionOutcomes.length; i += 1) {
      const prev = result.conceptionOutcomes[i - 1];
      const curr = result.conceptionOutcomes[i];
      assert.ok(prev.rawProbability >= curr.rawProbability);
    }
  });

  it("does not include nonviable outcomes in the live-puppy denominator without labeling", () => {
    const parent = dog({ foxi3: ["N", "Dup"] });
    const result = calculateBreeding(parent, parent);
    assert.equal(result.viableRenormalized, true);
    assert.ok(result.pairingFlags.some((flag) => flag.code === "hairless-hairless-pairing"));
    assert.ok(!result.viableOutcomes.some((item) => item.phenotype.slug.startsWith("nonviable")));
  });
});

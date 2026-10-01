import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultGenotype } from "./genotype";
import { calculateBreeding } from "./inheritance";
import { resolvePhenotype } from "./phenotypeResolver";
import type { Genotype } from "./types";

function dog(overrides: Partial<Genotype> = {}): Genotype {
  return { ...defaultGenotype(), ...overrides };
}

describe("phenotype resolver", () => {
  it("masks eumelanin pattern on e/e while keeping genotype detail", () => {
    const creamBrindle = dog({ mc1r: ["e", "e"], k: ["kbr", "kbr"] });
    const resolved = resolvePhenotype(creamBrindle);
    assert.equal(resolved.commonName.includes("Brindle"), false);
    assert.match(resolved.commonName, /Cream/);
    assert.ok(resolved.carriedTraits.some((item) => item.toLowerCase().includes("pattern")));
    assert.match(resolved.genotypeSummary, /kbr/);
  });

  it("resolves K locus before ASIP visibility", () => {
    const fawn = resolvePhenotype(dog({ k: ["ky", "ky"], asip: ["dy", "dy"] }));
    const black = resolvePhenotype(dog({ k: ["KB", "KB"], asip: ["dy", "dy"] }));
    assert.equal(fawn.commonName, "Fawn");
    assert.equal(black.commonName, "Black");
    assert.ok(black.carriedTraits.some((item) => item.includes("ASIP")));
  });

  it("keeps brown, cocoa, and dilution independent", () => {
    const chocolate = resolvePhenotype(dog({ k: ["KB", "KB"], tyrp1: ["bs", "bd"] }));
    const cocoa = resolvePhenotype(dog({ k: ["KB", "KB"], cocoa: ["co", "co"] }));
    const lilac = resolvePhenotype(dog({ k: ["KB", "KB"], tyrp1: ["bs", "bs"], dilute: ["d1", "d3"] }));
    const isabella = resolvePhenotype(dog({ k: ["KB", "KB"], cocoa: ["co", "co"], dilute: ["d1", "d1"] }));
    const newShade = resolvePhenotype(dog({ k: ["KB", "KB"], tyrp1: ["bs", "bs"], cocoa: ["co", "co"] }));
    assert.equal(chocolate.commonName, "Chocolate");
    assert.equal(cocoa.commonName, "Cocoa");
    assert.equal(lilac.commonName, "Lilac");
    assert.equal(isabella.commonName, "Isabella");
    assert.equal(newShade.commonName, "New Shade");
    assert.equal(lilac.breederTerm, true);
  });

  it("Pink masks ordinary pigment and retains genotype", () => {
    const pink = resolvePhenotype(dog({ slc45a2: ["ca", "ca"], k: ["KB", "KB"], merle: ["M", "m"] }));
    assert.equal(pink.commonName.startsWith("Pink"), true);
    assert.equal(pink.merleVisible, false);
    assert.ok(pink.carriedTraits.some((item) => item.includes("Ordinary pigment") || item.includes("Merle")));
    assert.match(pink.genotypeSummary, /KB/);
  });

  it("hidden merle stays in genotype when cream masks the coat", () => {
    const creamMerle = resolvePhenotype(dog({ mc1r: ["e", "e"], merle: ["M", "m"] }));
    assert.equal(creamMerle.merleVisible, false);
    assert.ok(creamMerle.slug.includes("cryptic-merle"));
    assert.ok(creamMerle.carriedTraits.some((item) => item.includes("Merle")));
  });

  it("pied adds a variability caveat", () => {
    const pied = resolvePhenotype(dog({ mitf: ["N", "S"] }));
    assert.ok(pied.commonName.includes("Pied"));
    assert.ok(pied.caveats.some((item) => item.toLowerCase().includes("white")));
  });

  it("hairless overrides fluffy in the visible name", () => {
    const both = resolvePhenotype(dog({ foxi3: ["N", "Dup"], fgf5: ["L4", "L4"] }));
    assert.ok(both.commonName.includes("Hairless"));
    assert.equal(both.commonName.includes("Fluffy"), false);
  });

  it("aggregates equal visible phenotypes from multiple genotypes", () => {
    const sire = dog({ k: ["KB", "ky"] });
    const dam = dog({ k: ["ky", "ky"] });
    const result = calculateBreeding(sire, dam);
    const blacks = result.conceptionOutcomes.filter((item) => item.phenotype.commonName === "Black");
    const fawns = result.conceptionOutcomes.filter((item) => item.phenotype.commonName === "Fawn");
    assert.equal(blacks.length, 1);
    assert.equal(fawns.length, 1);
    assert.equal(blacks[0].displayPercent, "50.00");
    assert.equal(fawns[0].displayPercent, "50.00");
  });

  it("classic fawn names Fawn", () => {
    assert.equal(resolvePhenotype(dog()).commonName, "Fawn");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baselineDogState, withBigRope } from "./dogState";
import { baselineGenotype } from "./genotype";
import { CONCEPTION_DENOMINATOR, calculateLitter, crossLocus, gametes, type LitterResult } from "./inheritance";
import { sumDisplayedPercents } from "./probabilityFormatting";
import type { Genotype, LocusId } from "./types";

function dog(overrides: Partial<Record<LocusId, string>> = {}): Genotype {
  return { ...baselineGenotype(), ...overrides };
}

function locusMap(result: LitterResult, locus: LocusId): Record<string, { percent: string; status: string }> {
  const rows = result.loci.find((item) => item.locus === locus)?.rows ?? [];
  return Object.fromEntries(rows.map((row) => [row.option, { percent: row.percent, status: row.status }]));
}

describe("Mendelian inheritance", () => {
  it("derives gametes from each parent", () => {
    assert.deepEqual(gametes("dilute", "D/d"), [
      { allele: "D", weight: 1 },
      { allele: "d", weight: 1 },
    ]);
    assert.deepEqual(gametes("dilute", "d/d"), [{ allele: "d", weight: 2 }]);
  });

  it("gives D/d × D/d → 25% D/D, 50% D/d, 25% d/d with exact weights", () => {
    assert.deepEqual(crossLocus("dilute", "D/d", "D/d"), [
      { option: "D/D", weight: 1 },
      { option: "D/d", weight: 2 },
      { option: "d/d", weight: 1 },
    ]);
    const result = calculateLitter(dog({ dilute: "D/d" }), dog({ dilute: "D/d" }));
    assert.deepEqual(locusMap(result, "dilute"), {
      "D/D": { percent: "25.00", status: "clear" },
      "D/d": { percent: "50.00", status: "carrier" },
      "d/d": { percent: "25.00", status: "expressed" },
    });
  });

  const carriers: [LocusId, string, [string, string, string]][] = [
    ["tyrp1", "B/b", ["B/B", "B/b", "b/b"]],
    ["cocoa", "Co/co", ["Co/Co", "Co/co", "co/co"]],
    ["mitf", "N/S", ["N/N", "N/S", "S/S"]],
    ["fgf5", "L/l", ["L/L", "L/l", "l/l"]],
    ["intensity", "N/In", ["N/N", "N/In", "In/In"]],
    ["slc45a2", "N/alb", ["N/N", "N/alb", "alb/alb"]],
  ];
  for (const [locus, carrier, [clear, het, hom]] of carriers) {
    it(`gives ${carrier} × ${carrier} → 25/50/25 at ${locus}`, () => {
      const result = calculateLitter(dog({ [locus]: carrier }), dog({ [locus]: carrier }));
      const map = locusMap(result, locus);
      assert.equal(map[clear]?.percent, "25.00");
      assert.equal(map[het]?.percent, "50.00");
      assert.equal(map[hom]?.percent, "25.00");
      assert.equal(map[het]?.status, "carrier");
    });
  }

  it("gives M/m × M/m → 25% m/m, 50% M/m, 25% M/M with the safety flag", () => {
    const parent = dog({ k: "KB/KB", merle: "M/m" });
    const result = calculateLitter(parent, parent);
    assert.deepEqual(locusMap(result, "merle"), {
      "m/m": { percent: "25.00", status: "clear" },
      "M/m": { percent: "50.00", status: "expressed" },
      "M/M": { percent: "25.00", status: "concerning" },
    });
    assert.ok(result.pairing.some((warning) => warning.code === "merle-pairing"));
    assert.equal(result.doubleMerle?.percent, "25.00");
    const concerning = result.groups.filter((group) => group.result.kind === "concerning");
    assert.equal(concerning.length, 1);
    assert.equal(concerning[0]?.result.publicName, "Black Double Merle");
    assert.equal(concerning[0]?.percent, "25.00");
    assert.equal(concerning[0]?.eligibility.eligible, false);
  });

  it("gives N/Dup × N/Dup → 25% N/N, 50% N/Dup, 25% Dup/Dup at conception", () => {
    const parent = dog({ foxi3: "N/Dup" });
    const result = calculateLitter(parent, parent);
    assert.deepEqual(locusMap(result, "foxi3"), {
      "N/N": { percent: "25.00", status: "clear" },
      "N/Dup": { percent: "50.00", status: "expressed" },
      "Dup/Dup": { percent: "25.00", status: "nonviable" },
    });
    assert.ok(result.pairing.some((warning) => warning.code === "hairless-pairing"));
    assert.equal(result.nonviable?.percent, "25.00");
    assert.deepEqual(result.nonviable?.exact, { numerator: 1, denominator: 4 });
  });

  it("keeps Big Rope out of every genetic distribution", () => {
    const stud = withBigRope(baselineDogState(), true);
    const plain = baselineDogState();
    const withRope = calculateLitter(stud.genotype, dog({ dilute: "D/d" }));
    const withoutRope = calculateLitter(plain.genotype, dog({ dilute: "D/d" }));
    assert.deepEqual(withRope, withoutRope);
    for (const group of withRope.groups) assert.doesNotMatch(group.result.publicName, /Big Rope/);
  });
});

describe("litter aggregation and display", () => {
  it("aggregates equivalent visible genotypes exactly", () => {
    const result = calculateLitter(dog({ dilute: "D/d" }), dog({ dilute: "D/d" }));
    assert.deepEqual(
      result.groups.map((group) => [group.result.publicName, group.exact, group.percent]),
      [
        ["Fawn Solid", { numerator: 3, denominator: 4 }, "75.00"],
        ["Blue Fawn Solid", { numerator: 1, denominator: 4 }, "25.00"],
      ],
    );
    const fawn = result.groups[0];
    assert.deepEqual(
      fawn?.possibleGenotypes.dilute.map((item) => [item.option, item.exactWithinGroup, item.percentWithinGroup]),
      [
        ["D/D", { numerator: 1, denominator: 3 }, "33.33"],
        ["D/d", { numerator: 2, denominator: 3 }, "66.67"],
      ],
    );
  });

  it("merges Dominant Black and Recessive Black into one Black Solid group", () => {
    const result = calculateLitter(dog({ k: "KB/ky", asip: "ady/a" }), dog({ k: "ky/ky", asip: "ady/a" }));
    const black = result.groups.find((group) => group.result.publicName === "Black Solid");
    assert.ok(black);
    // Kᴮ/kʸ (1/2) plus kʸ/kʸ with a/a (1/2 × 1/4) = 5/8.
    assert.deepEqual(black.exact, { numerator: 5, denominator: 8 });
    assert.deepEqual(
      black.possibleGenotypes.k.map((item) => item.option),
      ["KB/ky", "ky/ky"],
    );
  });

  it("shows two decimals and totals exactly 100.00% with the nonviable share", () => {
    const parent = dog({
      foxi3: "N/Dup",
      dilute: "D/d",
      cocoa: "Co/co",
      tyrp1: "B/b",
      mitf: "N/S",
      merle: "M/m",
      mc1r: "Em/e",
      k: "KB/ky",
      asip: "ady/a",
    });
    const result = calculateLitter(parent, dog({ ...parent, asip: "asy/abb", k: "kbr/ky", mc1r: "eA/e" }));
    const percents = result.groups.map((group) => group.percent);
    for (const value of percents) assert.match(value, /^(<0\.01|\d+\.\d{2})$/);
    assert.ok(result.nonviable);
    assert.equal(sumDisplayedPercents([...percents, result.nonviable.percent]), "100.00");
    assert.equal(sumDisplayedPercents(result.groups.map((group) => group.viablePercent ?? "0.00")), "100.00");
    for (const locus of result.loci) {
      assert.equal(sumDisplayedPercents(locus.rows.map((row) => row.percent)), "100.00", locus.locus);
    }
  });

  it("keeps raw probabilities exact and separate from the display", () => {
    const parent = dog({ dilute: "D/d", cocoa: "Co/co", tyrp1: "B/b" });
    const result = calculateLitter(parent, parent);
    const total = result.groups.reduce((sum, group) => sum + group.weight, 0);
    assert.equal(total, CONCEPTION_DENOMINATOR);
    assert.equal(result.groups.length, 8);
  });

  it("sorts by probability, then name, deterministically", () => {
    const result = calculateLitter(dog({ mitf: "N/S", fgf5: "L/l" }), dog({ mitf: "S/S", fgf5: "l/l" }));
    assert.deepEqual(
      result.groups.map((group) => [group.result.publicName, group.percent]),
      [
        ["Fawn Pied", "25.00"],
        ["Fawn Pied Fluffy", "25.00"],
        ["Fawn Solid", "25.00"],
        ["Fawn Solid Fluffy", "25.00"],
      ],
    );
    assert.deepEqual(result.mostLikely?.names, ["Fawn Pied", "Fawn Pied Fluffy", "Fawn Solid", "Fawn Solid Fluffy"]);
    assert.deepEqual(calculateLitter(dog({ mitf: "N/S", fgf5: "L/l" }), dog({ mitf: "S/S", fgf5: "l/l" })), result);
  });

  it("never turns Dup/Dup into a puppy group or hides it from the denominator", () => {
    const parent = dog({ foxi3: "N/Dup" });
    const result = calculateLitter(parent, parent);
    assert.deepEqual(
      result.groups.map((group) => [group.result.publicName, group.percent, group.viablePercent]),
      [
        ["Hairless Fawn Solid", "50.00", "66.67"],
        ["Fawn Solid", "25.00", "33.33"],
      ],
    );
    assert.equal(result.viableTotal.percent, "75.00");
    assert.ok(result.groups.every((group) => group.result.kind !== ("nonviable" as string)));
  });

  it("stays fast on the widest supported cross", () => {
    const stud = dog({
      asip: "ady/a",
      dilute: "D/d",
      cocoa: "Co/co",
      tyrp1: "B/b",
      k: "KB/ky",
      mc1r: "Em/e",
      mitf: "N/S",
      merle: "M/m",
      fgf5: "L/l",
      intensity: "N/In",
      slc45a2: "N/alb",
      foxi3: "N/Dup",
    });
    const dam = dog({ ...stud, asip: "asy/abb", k: "kbr/ky", mc1r: "eA/e" });
    const started = performance.now();
    const result = calculateLitter(stud, dam);
    const elapsed = performance.now() - started;
    assert.ok(result.groups.length > 500);
    assert.ok(elapsed < 1500, `took ${elapsed.toFixed(0)} ms`);
  });
});

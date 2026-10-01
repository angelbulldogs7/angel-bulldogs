import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allocateHundredths,
  allocatePercents,
  formatShare,
  reduceFraction,
  sumDisplayedPercents,
} from "./probabilityFormatting";

describe("probability display", () => {
  it("allocates hundredths with the largest-remainder method so displays total 100.00", () => {
    assert.deepEqual(allocateHundredths([1, 1, 1]), [3334, 3333, 3333]);
    assert.deepEqual(allocatePercents([1, 1, 1]), ["33.34", "33.33", "33.33"]);
    assert.equal(sumDisplayedPercents(allocatePercents([1, 2, 3, 5, 7, 11])), "100.00");
  });

  it("gives ties to the earlier item in the caller's deterministic order", () => {
    assert.deepEqual(allocateHundredths([1, 1, 1, 1, 1, 1]), [1667, 1667, 1667, 1667, 1666, 1666]);
  });

  it("always shows two decimals and never hides a real chance as zero", () => {
    const percents = allocatePercents([1, 16_777_215]);
    assert.deepEqual(percents, ["<0.01", "100.00"]);
    assert.equal(formatShare(1, 4), "25.00");
    assert.equal(formatShare(0, 4), "0.00");
    assert.equal(formatShare(4, 4), "100.00");
  });

  it("reduces exact fractions without floating-point drift", () => {
    assert.deepEqual(reduceFraction(4_194_304, 16_777_216), { numerator: 1, denominator: 4 });
    assert.deepEqual(reduceFraction(0, 16), { numerator: 0, denominator: 1 });
    assert.throws(() => reduceFraction(1, 0));
    assert.throws(() => reduceFraction(0.5, 2));
  });
});

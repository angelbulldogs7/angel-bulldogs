import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allocateHundredths, frac } from "./fractions";
import { displayedPercentsSum, attachDisplayPercents } from "./probabilityFormatting";

describe("probability display", () => {
  it("allocates hundredths that sum to 10000", () => {
    const parts = allocateHundredths([frac(1n, 3n), frac(1n, 3n), frac(1n, 3n)]);
    assert.equal(parts.reduce((sum, item) => sum + item, 0), 10000);
  });

  it("formats every probability with two decimals totaling 100.00", () => {
    const rows = attachDisplayPercents([
      { numerator: 1n, denominator: 3n },
      { numerator: 1n, denominator: 3n },
      { numerator: 1n, denominator: 3n },
    ]);
    for (const row of rows) {
      assert.match(row.displayPercent, /^\d+\.\d{2}$/);
    }
    assert.equal(
      displayedPercentsSum(rows.map((row) => row.displayPercent)),
      "100.00",
    );
  });
});

export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Color Lab ${label} must be a non-negative safe integer.`);
  }
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function reduceFraction(numerator: number, denominator: number): Fraction {
  assertSafeInteger(numerator, "probability numerator");
  assertSafeInteger(denominator, "probability denominator");
  if (denominator === 0) throw new Error("Color Lab probability denominator cannot be zero.");
  if (numerator === 0) return { numerator: 0, denominator: 1 };
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

export function formatFraction(value: Fraction): string {
  return `${value.numerator}/${value.denominator}`;
}

/**
 * Largest-remainder allocation of hundredths of a percent (10000 = 100.00%).
 * Raw weights are never modified; ties go to the earlier item, so callers must pass a
 * deterministic order.
 */
export function allocateHundredths(weights: readonly number[]): number[] {
  if (weights.length === 0) return [];
  for (const weight of weights) assertSafeInteger(weight, "weight");
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return weights.map(() => 0);
  assertSafeInteger(total * 10000, "scaled total");

  const floors = weights.map((weight) => Math.floor((weight * 10000) / total));
  const remainders = weights
    .map((weight, index) => ({ index, remainder: (weight * 10000) % total }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  const result = [...floors];
  let leftover = 10000 - floors.reduce((sum, value) => sum + value, 0);
  for (const item of remainders) {
    if (leftover === 0) break;
    result[item.index] += 1;
    leftover -= 1;
  }
  return result;
}

/** Always two decimals. A nonzero chance that rounds to zero displays as "<0.01". */
export function formatHundredths(hundredths: number, hasChance: boolean): string {
  if (hundredths === 0 && hasChance) return "<0.01";
  return (hundredths / 100).toFixed(2);
}

export function allocatePercents(weights: readonly number[]): string[] {
  return allocateHundredths(weights).map((hundredths, index) =>
    formatHundredths(hundredths, (weights[index] ?? 0) > 0),
  );
}

/** A single probability shown on its own, as a share of its denominator. */
export function formatShare(numerator: number, denominator: number): string {
  const [hundredths] = allocateHundredths([numerator, denominator - numerator]);
  return formatHundredths(hundredths ?? 0, numerator > 0);
}

export function sumDisplayedPercents(percents: readonly string[]): string {
  const hundredths = percents.reduce(
    (sum, value) => sum + (value === "<0.01" ? 0 : Math.round(Number.parseFloat(value) * 100)),
    0,
  );
  return (hundredths / 100).toFixed(2);
}

import {
  allocateHundredths,
  formatTwoDecimalsFromHundredths,
  toNumber,
  type Fraction,
} from "./fractions";

export function formatPercent(value: Fraction): string {
  return formatShareOfWhole(value);
}

/** Format a single probability as a share of 1, not as a one-item 100% list. */
export function formatShareOfWhole(value: Fraction): string {
  const complement = { n: value.d - value.n, d: value.d };
  const [hundredths] = allocateHundredths([value, complement]);
  return formatTwoDecimalsFromHundredths(hundredths ?? 0);
}

export function attachDisplayPercents<T extends { numerator: bigint; denominator: bigint }>(
  items: T[],
): Array<T & { displayPercent: string; rawProbability: number }> {
  const weights: Fraction[] = items.map((item) => ({ n: item.numerator, d: item.denominator }));
  const hundredths = allocateHundredths(weights);
  return items.map((item, index) => ({
    ...item,
    displayPercent: formatTwoDecimalsFromHundredths(hundredths[index] ?? 0),
    rawProbability: toNumber({ n: item.numerator, d: item.denominator }),
  }));
}

export function displayedPercentsSum(displayPercents: string[]): string {
  const hundredths = displayPercents.reduce((sum, item) => {
    return sum + Math.round(Number.parseFloat(item) * 100);
  }, 0);
  return formatTwoDecimalsFromHundredths(hundredths);
}

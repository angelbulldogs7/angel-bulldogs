export interface Fraction {
  n: bigint;
  d: bigint;
}

export function frac(n: bigint | number, d: bigint | number = 1n): Fraction {
  return simplify({ n: BigInt(n), d: BigInt(d) });
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return (a / gcd(a, b)) * b;
}

export function simplify(value: Fraction): Fraction {
  if (value.d === 0n) {
    throw new Error("Division by zero in Color Lab probability math.");
  }
  const sign = value.d < 0n ? -1n : 1n;
  const n = value.n * sign;
  const d = value.d * sign;
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function addFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}

export function mulFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ n: a.n * b.n, d: a.d * b.d });
}

export function toNumber(value: Fraction): number {
  return Number(value.n) / Number(value.d);
}

/**
 * Largest-remainder allocation so displayed hundredths sum to 10000 (100.00%).
 * Raw fractions are left unchanged.
 */
export function allocateHundredths(weights: Fraction[]): number[] {
  if (weights.length === 0) return [];
  const common = weights.reduce((acc, item) => lcm(acc, item.d), 1n);
  const nums = weights.map((item) => item.n * (common / item.d));
  const total = nums.reduce((sum, item) => sum + item, 0n);
  if (total === 0n) return weights.map(() => 0);
  const floors = nums.map((num) => Number((num * 10000n) / total));
  let remainder = 10000 - floors.reduce((sum, item) => sum + item, 0);
  const remainders = nums
    .map((num, index) => ({ index, rem: (num * 10000n) % total }))
    .sort((a, b) => {
      if (a.rem === b.rem) return a.index - b.index;
      return a.rem > b.rem ? -1 : 1;
    });
  const result = [...floors];
  for (let i = 0; i < remainder; i += 1) {
    result[remainders[i].index] += 1;
  }
  return result;
}

export function formatTwoDecimalsFromHundredths(hundredths: number): string {
  return (hundredths / 100).toFixed(2);
}

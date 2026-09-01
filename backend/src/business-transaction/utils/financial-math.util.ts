import { Prisma } from '@prisma/client';

/**
 * Safe financial arithmetic utilities for IMCMS.
 * Enforces exact Decimal(18, 4) arithmetic without IEEE-754 floating point drift.
 */

export function toDecimal(
  value: number | string | Prisma.Decimal | null | undefined,
): Prisma.Decimal {
  if (value === null || value === undefined || value === '') {
    return new Prisma.Decimal(0);
  }
  return new Prisma.Decimal(value);
}

export function safeMultiply(
  a: number | string | Prisma.Decimal | null | undefined,
  b: number | string | Prisma.Decimal | null | undefined,
  decimals = 4,
): number {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.times(decB).toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

export function safeAdd(
  values: (number | string | Prisma.Decimal | null | undefined)[],
  decimals = 4,
): number {
  let sum = new Prisma.Decimal(0);
  for (const v of values) {
    sum = sum.plus(toDecimal(v));
  }
  return sum.toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

export function safeSubtract(
  a: number | string | Prisma.Decimal | null | undefined,
  b: number | string | Prisma.Decimal | null | undefined,
  decimals = 4,
): number {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.minus(decB).toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

export function safeVariancePercentage(
  variance: number | string | Prisma.Decimal | null | undefined,
  predicted: number | string | Prisma.Decimal | null | undefined,
  decimals = 2,
): number {
  const decPredicted = toDecimal(predicted);
  if (decPredicted.isZero() || decPredicted.isNegative()) {
    return 0;
  }
  const decVariance = toDecimal(variance);
  const percentage = decVariance
    .dividedBy(decPredicted)
    .times(100)
    .toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();

  if (percentage > 999.99) return 999.99;
  if (percentage < -999.99) return -999.99;
  return percentage;
}

export function roundTo4Decimals(
  value: number | string | Prisma.Decimal | null | undefined,
): number {
  return toDecimal(value).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

export enum MaterialShape {
  ROUND = 'ROUND',
  PLATE = 'PLATE',
  RECTANGLE = 'RECTANGLE',
  SQUARE = 'SQUARE',
}

export interface WeightCalculationParams {
  shape: string;
  densityKgPerDm3: number;
  diameterMm?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
}

export function calculateRoundWeight(
  diameterMm: number,
  lengthMm: number,
  densityKgPerDm3: number,
): number {
  if (diameterMm <= 0 || lengthMm <= 0 || densityKgPerDm3 <= 0) {
    return 0;
  }
  const radius = diameterMm / 2;
  const volumeMm3 = Math.PI * radius * radius * lengthMm;
  const weightKg = (volumeMm3 * densityKgPerDm3) / 1000000;
  return Number(weightKg.toFixed(4));
}

export function calculatePrismaticWeight(
  lengthMm: number,
  widthMm: number,
  heightMm: number,
  densityKgPerDm3: number,
): number {
  if (lengthMm <= 0 || widthMm <= 0 || heightMm <= 0 || densityKgPerDm3 <= 0) {
    return 0;
  }
  const volumeMm3 = lengthMm * widthMm * heightMm;
  const weightKg = (volumeMm3 * densityKgPerDm3) / 1000000;
  return Number(weightKg.toFixed(4));
}

export function calculateMaterialWeight(params: WeightCalculationParams): number {
  const { shape, densityKgPerDm3, diameterMm, lengthMm, widthMm, heightMm } = params;

  const numDensity = Number(densityKgPerDm3);

  if (!numDensity || numDensity <= 0) {
    return 0;
  }

  switch (shape?.toUpperCase()) {
    case MaterialShape.ROUND:
    case 'CIRCLE':
      return calculateRoundWeight(diameterMm || 0, lengthMm || 0, numDensity);
    case MaterialShape.PLATE:
    case MaterialShape.RECTANGLE:
    case 'RECTANGULAR':
    case MaterialShape.SQUARE:
      return calculatePrismaticWeight(lengthMm || 0, widthMm || 0, heightMm || 0, numDensity);
    default:
      return 0;
  }
}

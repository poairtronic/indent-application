import {
  safeMultiply,
  safeAdd,
  safeSubtract,
  safeVariancePercentage,
  roundTo4Decimals,
} from '../utils/financial-math.util';

describe('Financial Math Precision (BUG-FIN-001)', () => {
  describe('safeMultiply', () => {
    it('should accurately multiply floats without IEEE-754 drift', () => {
      // 0.1 * 0.2 in native JS produces 0.020000000000000004
      const result = safeMultiply(0.1, 0.2);
      expect(result).toBe(0.02);
    });

    it('should handle large and tiny numbers', () => {
      expect(safeMultiply(999999.9999, 2)).toBe(1999999.9998);
      expect(safeMultiply(0.0001, 0.0001)).toBe(0); // 0.00000001 rounded to 4 decimals = 0
      expect(safeMultiply(0.0001, 10)).toBe(0.001);
    });

    it('should handle null/undefined/0 gracefully', () => {
      expect(safeMultiply(null, 100)).toBe(0);
      expect(safeMultiply(100, undefined)).toBe(0);
      expect(safeMultiply(0, 0)).toBe(0);
    });
  });

  describe('safeAdd', () => {
    it('should accurately sum floats without IEEE-754 drift', () => {
      // 0.1 + 0.2 in native JS produces 0.30000000000000004
      const result = safeAdd([0.1, 0.2]);
      expect(result).toBe(0.3);
    });

    it('should accurately sum multiple cost components', () => {
      const materialCost = 15000.4567;
      const processCost = 8250.1234;
      const designCost = 2500.0;
      const overheadCost = 1250.3333;
      const contingencyCost = 750.0866;

      const total = safeAdd([materialCost, processCost, designCost, overheadCost, contingencyCost]);
      // Exact sum: 27751.0
      expect(total).toBe(27751.0);
    });

    it('should filter out null and undefined values', () => {
      expect(safeAdd([10, null, 20, undefined, 30.5])).toBe(60.5);
    });
  });

  describe('safeSubtract', () => {
    it('should accurately compute variance without drift', () => {
      const actual = 100.3;
      const predicted = 100.1;
      // 100.3 - 100.1 in native JS produces 0.19999999999998863
      expect(safeSubtract(actual, predicted)).toBe(0.2);
    });

    it('should handle negative variance correctly', () => {
      expect(safeSubtract(80, 100)).toBe(-20);
    });
  });

  describe('safeVariancePercentage', () => {
    it('should compute exact variance percentage to 2 decimal places', () => {
      // Variance = 20, Predicted = 100 -> 20.00%
      expect(safeVariancePercentage(20, 100)).toBe(20);
      // Variance = 1, Predicted = 3 -> 33.33%
      expect(safeVariancePercentage(1, 3)).toBe(33.33);
      // Negative variance
      expect(safeVariancePercentage(-15, 100)).toBe(-15);
    });

    it('should handle zero, null, and negative predicted totals without division by zero or NaN', () => {
      expect(safeVariancePercentage(50, 0)).toBe(0);
      expect(safeVariancePercentage(50, null)).toBe(0);
      expect(safeVariancePercentage(50, -100)).toBe(0);
      expect(safeVariancePercentage(0, 100)).toBe(0);
    });
  });

  describe('roundTo4Decimals', () => {
    it('should round to exact 4 decimal places', () => {
      expect(roundTo4Decimals(123.456789)).toBe(123.4568);
      expect(roundTo4Decimals(100)).toBe(100);
      expect(roundTo4Decimals(null)).toBe(0);
    });
  });
});

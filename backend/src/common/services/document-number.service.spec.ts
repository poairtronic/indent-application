import { DocumentNumberService, DocumentType, COMPANY_CODE } from './document-number.service';

describe('DocumentNumberService', () => {
  let service: DocumentNumberService;
  let mockPrisma: any;

  beforeEach(() => {
    // In-memory counter store to simulate PostgreSQL atomic sequence table for unit tests
    const sequenceStore: Record<string, number> = {};

    mockPrisma = {
      $queryRaw: jest.fn().mockImplementation(async (strings: TemplateStringsArray, ...values: any[]) => {
        const docType = values[0];
        const year = values[1];
        const key = `${docType}_${year}`;

        if (!sequenceStore[key]) {
          sequenceStore[key] = 1;
        } else {
          sequenceStore[key] += 1;
        }

        return [{ reservedNumber: sequenceStore[key] }];
      }),
    };

    service = new DocumentNumberService(mockPrisma);
  });

  it('should format sequence numbers with minimum 3-digit zero-padding', () => {
    expect(service.formatSequenceNumber(1)).toBe('001');
    expect(service.formatSequenceNumber(9)).toBe('009');
    expect(service.formatSequenceNumber(10)).toBe('010');
    expect(service.formatSequenceNumber(99)).toBe('099');
    expect(service.formatSequenceNumber(100)).toBe('100');
    expect(service.formatSequenceNumber(999)).toBe('999');
    expect(service.formatSequenceNumber(1000)).toBe('1000');
    expect(service.formatSequenceNumber(1001)).toBe('1001');
  });

  it('should generate sequential Indent numbers for a given year', async () => {
    const num1 = await service.generateIndentNumber(undefined, { year: 2026 });
    const num2 = await service.generateIndentNumber(undefined, { year: 2026 });
    const num3 = await service.generateIndentNumber(undefined, { year: 2026 });

    expect(num1).toBe('AGIPL-IND-2026-001');
    expect(num2).toBe('AGIPL-IND-2026-002');
    expect(num3).toBe('AGIPL-IND-2026-003');
  });

  it('should reset sequence to 001 when calendar year rolls over for Indents', async () => {
    const ind2026_1 = await service.generateIndentNumber(undefined, { year: 2026 });
    const ind2026_2 = await service.generateIndentNumber(undefined, { year: 2026 });
    expect(ind2026_1).toBe('AGIPL-IND-2026-001');
    expect(ind2026_2).toBe('AGIPL-IND-2026-002');

    // Year change simulation to 2027
    const ind2027_1 = await service.generateIndentNumber(undefined, { year: 2027 });
    const ind2027_2 = await service.generateIndentNumber(undefined, { year: 2027 });
    expect(ind2027_1).toBe('AGIPL-IND-2027-001');
    expect(ind2027_2).toBe('AGIPL-IND-2027-002');
  });

  it('should generate independent sequential Cost Sheet numbers for each year', async () => {
    const cs1 = await service.generateCostSheetNumber(undefined, { year: 2026 });
    const cs2 = await service.generateCostSheetNumber(undefined, { year: 2026 });
    expect(cs1).toBe('AGIPL-CS-2026-001');
    expect(cs2).toBe('AGIPL-CS-2026-002');

    // Year change simulation
    const cs2027_1 = await service.generateCostSheetNumber(undefined, { year: 2027 });
    expect(cs2027_1).toBe('AGIPL-CS-2027-001');
  });

  it('should maintain global non-resetting sequence for Materials', async () => {
    const mat1 = await service.generateMaterialNumber();
    const mat2 = await service.generateMaterialNumber();
    const mat3 = await service.generateMaterialNumber();

    expect(mat1).toBe('AGIPL-MAT-001');
    expect(mat2).toBe('AGIPL-MAT-002');
    expect(mat3).toBe('AGIPL-MAT-003');
  });

  it('should maintain global non-resetting sequence for Products', async () => {
    const prd1 = await service.generateProductNumber();
    const prd2 = await service.generateProductNumber();
    const prd3 = await service.generateProductNumber();

    expect(prd1).toBe('AGIPL-PRD-001');
    expect(prd2).toBe('AGIPL-PRD-002');
    expect(prd3).toBe('AGIPL-PRD-003');
  });

  it('should handle 20 concurrent requests without collision or duplicates', async () => {
    const promises = Array.from({ length: 20 }, () =>
      service.generateIndentNumber(undefined, { year: 2026 }),
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(20);

    // Verify all generated numbers are unique
    const uniqueSet = new Set(results);
    expect(uniqueSet.size).toBe(20);

    // Verify the numbers match AGIPL-IND-2026-001 through AGIPL-IND-2026-020
    for (let i = 1; i <= 20; i++) {
      const expected = `AGIPL-IND-2026-${service.formatSequenceNumber(i)}`;
      expect(uniqueSet.has(expected)).toBe(true);
    }
  });
});

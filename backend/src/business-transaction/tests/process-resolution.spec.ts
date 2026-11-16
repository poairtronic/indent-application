import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateIndentSheetDto } from '../dto/create-indent-sheet.dto';
import { CreateProcessCostSheetDto } from '../dto/create-process-cost-sheet.dto';
import { IndentPriority } from '../enums/workflow-state.enum';
import { BusinessTransactionService } from '../services/business-transaction.service';

describe('Custom Process Name Validation & Resolution', () => {
  it('should accept non-UUID custom process names (e.g. FITTING) in IndentProcessDto without validation error', async () => {
    const rawData = {
      productName: 'Gearbox',
      departmentName: 'Design',
      priority: IndentPriority.HIGH,
      requiredDate: '2026-12-01T00:00:00.000Z',
      items: [
        {
          materialName: 'Steel',
          quantity: 10,
          unitId: 'b3e157e2-45ec-4475-a89a-14d232a52efc',
          processes: [
            {
              processId: 'FITTING',
              processName: 'FITTING',
              sequence: 1,
              estimatedHours: 2.5,
            },
          ],
        },
      ],
    };

    const dto = plainToInstance(CreateIndentSheetDto, rawData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept non-UUID custom process names in ProcessCostDto without validation error', async () => {
    const rawData = {
      predictedTotal: 500,
      costItems: [
        {
          predictedRate: 100,
          predictedQuantity: 5,
          predictedAmount: 500,
        },
      ],
      processCosts: [
        {
          processId: 'FITTING',
          processName: 'FITTING',
          predictedCost: 250,
          estimatedHours: 2,
        },
      ],
    };

    const dto = plainToInstance(CreateProcessCostSheetDto, rawData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('resolveProcess in BusinessTransactionService', () => {
    let service: any;
    let mockTx: any;

    beforeEach(() => {
      // Minimal instance of BusinessTransactionService with resolveProcess
      service = Object.create(BusinessTransactionService.prototype);

      mockTx = {
        manufacturingProcess: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      };
    });

    it('should return existing ID when a valid existing process UUID is supplied', async () => {
      const existingUUID = '123e4567-e89b-12d3-a456-426614174000';
      mockTx.manufacturingProcess.findFirst.mockResolvedValueOnce({
        id: existingUUID,
        processName: 'Milling',
      });

      const cache = new Map<string, string>();
      const result = await service['resolveProcess'](
        mockTx,
        existingUUID,
        'Milling',
        'user-uuid',
        cache,
      );

      expect(result).toBe(existingUUID);
      expect(mockTx.manufacturingProcess.create).not.toHaveBeenCalled();
    });

    it('should create a new ManufacturingProcess when a non-existent process name is supplied', async () => {
      mockTx.manufacturingProcess.findFirst.mockResolvedValueOnce(null); // not found by name
      const createdUUID = '555e4567-e89b-12d3-a456-426614174999';
      mockTx.manufacturingProcess.create.mockResolvedValueOnce({
        id: createdUUID,
        processName: 'FITTING',
        status: 'ACTIVE',
      });

      const cache = new Map<string, string>();
      const result = await service['resolveProcess'](
        mockTx,
        'FITTING',
        'FITTING',
        'user-uuid',
        cache,
      );

      expect(result).toBe(createdUUID);
      expect(mockTx.manufacturingProcess.create).toHaveBeenCalledWith({
        data: {
          processName: 'FITTING',
          status: 'ACTIVE',
          createdBy: 'user-uuid',
        },
      });
      // Should also populate the cache
      expect(cache.get('fitting')).toBe(createdUUID);
    });

    it('should reuse cache for repeated process names in the same transaction', async () => {
      const cache = new Map<string, string>();
      cache.set('fitting', 'cached-uuid-123');

      const result = await service['resolveProcess'](
        mockTx,
        'FITTING',
        'FITTING',
        'user-uuid',
        cache,
      );

      expect(result).toBe('cached-uuid-123');
      expect(mockTx.manufacturingProcess.findFirst).not.toHaveBeenCalled();
      expect(mockTx.manufacturingProcess.create).not.toHaveBeenCalled();
    });
  });
});

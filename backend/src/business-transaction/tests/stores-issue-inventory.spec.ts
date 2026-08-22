import { Test, TestingModule } from '@nestjs/testing';
import { BusinessTransactionService } from '../services/business-transaction.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessTransactionValidator } from '../validators/business-transaction.validator';
import { WorkflowStateMachineService } from '../services/workflow-state-machine.service';
import { BusinessTransactionEventService } from '../services/business-transaction-event.service';
import { AttachmentStorageService } from '../services/attachment-storage.service';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';
import { DocumentNumberService } from '../../common/services/document-number.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowState } from '../enums/workflow-state.enum';

describe('Stores Inventory Material Issue (BUG-REQ-001)', () => {
  let service: BusinessTransactionService;
  let mockPrisma: any;
  let mockWorkflowStateMachine: any;
  let mockEventService: any;
  let mockValidator: any;
  let mockAttachmentStorage: any;
  let mockCacheService: any;

  const sampleIndent = {
    id: 'indent-123',
    indentNumber: 'IND-2026-0001',
    currentState: WorkflowState.STORES_PROCESSING,
    status: 'PENDING_STORES',
    departmentId: 'dept-stores',
    remarks: 'Existing notes',
    attachments: [],
    indentItems: [
      {
        id: 'item-1',
        materialId: 'mat-1',
        quantity: 30,
        issuedQuantity: 0,
        unitId: 'unit-kg',
        status: 'AVAILABLE',
        material: {
          id: 'mat-1',
          materialName: 'Stainless Steel Rod',
          currentStock: 100,
        },
      },
    ],
  };

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      indent: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      indentItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      material: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({ currentStock: 70 }),
      },
      workflowHistory: {
        create: jest.fn(),
      },
      department: {
        findFirst: jest.fn().mockResolvedValue({ id: 'dept-prod', departmentCode: 'PRODUCTION' }),
      },
    };

    mockWorkflowStateMachine = {
      validateTransition: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      getStageDefinition: jest
        .fn()
        .mockReturnValue({ loop: 'MANUFACTURING_LOOP', allowedNextStates: [] }),
    };

    mockEventService = {
      dispatchNotification: jest.fn().mockResolvedValue(undefined),
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockValidator = {};
    mockAttachmentStorage = {};
    mockCacheService = {
      del: jest.fn().mockResolvedValue(undefined),
    };
    const mockDocumentNumberService = {
      generateIndentNumber: jest.fn().mockResolvedValue('AGIPL-IND-2026-001'),
      generateCostSheetNumber: jest.fn().mockResolvedValue('AGIPL-CS-2026-001'),
      generateMaterialNumber: jest.fn().mockResolvedValue('AGIPL-MAT-001'),
      generateProductNumber: jest.fn().mockResolvedValue('AGIPL-PRD-001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessTransactionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BusinessTransactionValidator, useValue: mockValidator },
        { provide: WorkflowStateMachineService, useValue: mockWorkflowStateMachine },
        { provide: BusinessTransactionEventService, useValue: mockEventService },
        { provide: AttachmentStorageService, useValue: mockAttachmentStorage },
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: DocumentNumberService, useValue: mockDocumentNumberService },
      ],
    }).compile();

    service = module.get<BusinessTransactionService>(BusinessTransactionService);
    jest.spyOn(service, 'findTransactionById').mockResolvedValue(sampleIndent as any);
    jest.spyOn(service, 'findTransactionForResponse').mockResolvedValue(sampleIndent as any);
    mockPrisma.indent.findUnique.mockResolvedValue(sampleIndent as any);
  });

  describe('storesIssueMaterials', () => {
    it('Test A: should decrement stock from 100 to 70 on issue of 30', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 30,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 100,
      }]);
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: 70,
      });
      mockPrisma.indent.updateMany.mockResolvedValue({ count: 1 });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Issue 30kg' });

      expect(mockPrisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: {
          currentStock: { decrement: 30 },
          updatedBy: 'user-1',
        },
      });
      expect(mockPrisma.indentItem.update).toHaveBeenCalled();
    });

    it('Test B: should decrement stock from 30 to 0 on issue of 30', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 30,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 30,
      }]);
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: 0,
      });
      mockPrisma.indent.updateMany.mockResolvedValue({ count: 1 });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Issue exact stock' });

      expect(mockPrisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: {
          currentStock: { decrement: 30 },
          updatedBy: 'user-1',
        },
      });
    });

    it('Test C: should reject when stock is 30 and requested is 31, leaving stock unchanged', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 31,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 30,
      }]);

      await expect(
        service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Over issue' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.material.update).not.toHaveBeenCalled();
      expect(mockPrisma.indentItem.updateMany).not.toHaveBeenCalled();
    });

    it('Test D: duplicate issue attempt should not decrement stock twice if items are already ISSUED', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 30,
          issuedQuantity: 30,
          status: 'ISSUED', // Already issued
        },
      ]);
      mockPrisma.indent.updateMany.mockResolvedValue({ count: 1 });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Repeat issue' });

      // No material stock decrement should happen for already issued items
      expect(mockPrisma.material.update).not.toHaveBeenCalled();
    });

    it('Test E: concurrent issue resulting in negative stock should fail safely', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 80,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 80,
      }]);
      // Simultaneous update drove stock negative
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: -60,
      });

      await expect(
        service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Concurrent issue' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Test F: should reject if material quantity is zero', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: 0,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 10,
      }]);
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: 10,
      });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Zero qty' });
      expect(mockPrisma.material.update).not.toHaveBeenCalled();
    });

    it('Test G: should reject if material quantity is negative', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          materialId: 'mat-1',
          quantity: -10,
          issuedQuantity: 0,
          status: 'AVAILABLE',
        },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([{
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 100,
      }]);
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: 110,
      });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Negative qty' });
      expect(mockPrisma.material.update).not.toHaveBeenCalled();
    });

    it('Test H: should process multiple material lines atomically', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        { id: 'item-1', materialId: 'mat-1', quantity: 10, issuedQuantity: 0, status: 'AVAILABLE' },
        { id: 'item-2', materialId: 'mat-2', quantity: 20, issuedQuantity: 0, status: 'AVAILABLE' },
      ]);
      mockPrisma.material.findMany.mockImplementation((args: any) => {
        const ids = args.where.id?.in ?? [];
        const results = [];
        if (ids.includes('mat-1')) results.push({ id: 'mat-1', currentStock: 50 });
        if (ids.includes('mat-2')) results.push({ id: 'mat-2', currentStock: 50 });
        return Promise.resolve(results);
      });
      mockPrisma.material.update.mockResolvedValue({ id: 'mat-1', currentStock: 40 }); // Mock response not strictly checked
      mockPrisma.indent.updateMany.mockResolvedValue({ count: 1 });

      await service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Multi line issue' });

      expect(mockPrisma.material.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.indentItem.update).toHaveBeenCalledTimes(2);
    });

    it('Test I: should reject if material is missing in DB', async () => {
      mockPrisma.indentItem.findMany.mockResolvedValue([
        { id: 'item-1', materialId: 'mat-invalid', quantity: 10, status: 'AVAILABLE' },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([]); // Missing material

      await expect(
        service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Missing mat' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('Test J: should reject if in an invalid workflow state', async () => {
      mockPrisma.indent.findUnique.mockResolvedValue({
        ...sampleIndent,
        currentState: WorkflowState.PRODUCTION_COMPLETED, // Invalid state for issue
      });

      mockWorkflowStateMachine.validateTransition.mockReturnValue({
        isValid: false,
        errors: ['Invalid state transition'],
      });

      await expect(
        service.storesIssueMaterials('indent-123', 'user-1', { remarks: 'Invalid state' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueSingleMaterialItem', () => {
    it('should issue single item and decrement material stock', async () => {
      mockPrisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        materialName: 'Stainless Steel Rod',
        currentStock: 50,
      });
      mockPrisma.material.update.mockResolvedValue({
        id: 'mat-1',
        currentStock: 20,
      });
      // COUNT query: 0 unissued items remaining (all issued)
      mockPrisma.indentItem.count.mockResolvedValue(0);

      await service.issueSingleMaterialItem('indent-123', 'item-1', 'user-1');

      expect(mockPrisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: {
          currentStock: { decrement: 30 },
          updatedBy: 'user-1',
        },
      });
      expect(mockPrisma.indentItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: 'ISSUED' },
      });
    });

    it('should reject single item issue if item is already ISSUED', async () => {
      const indentWithIssuedItem = {
        ...sampleIndent,
        indentItems: [
          {
            ...sampleIndent.indentItems[0],
            status: 'ISSUED',
          },
        ],
      };
      (mockPrisma.indent.findUnique as jest.Mock).mockResolvedValue(indentWithIssuedItem);

      await expect(
        service.issueSingleMaterialItem('indent-123', 'item-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.material.update).not.toHaveBeenCalled();
    });
  });
});

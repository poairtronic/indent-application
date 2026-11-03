import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InternalService } from './internal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationEventBus } from '../communication/events/communication-event.bus';
import { ItemIssuedDto } from './dto/item-issued.dto';

describe('InternalService', () => {
  let service: InternalService;
  let mockPrisma: any;
  let mockEventBus: any;

  beforeEach(async () => {
    mockPrisma = {
      indent: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'admin-uuid-1' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'prod-user-1' }]),
      },
      department: {
        findFirst: jest.fn().mockResolvedValue({ id: 'prod-dept-uuid' }),
      },
      indentItem: {
        update: jest.fn().mockResolvedValue({ id: 'item-1' }),
      },
      indentBroughtMaterial: {
        update: jest.fn().mockResolvedValue({ id: 'bo-1' }),
      },
      workflowHistory: {
        create: jest.fn().mockResolvedValue({ id: 'wh-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation((callback: any) => callback(mockPrisma)),
    };

    mockEventBus = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CommunicationEventBus, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<InternalService>(InternalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if indent does not exist', async () => {
    mockPrisma.indent.findUnique.mockResolvedValue(null);

    const dto: ItemIssuedDto = {
      indentId: 'nonexistent-id',
      indentNumber: 'IND-999',
      mercItemId: 'item-1',
      itemType: 'RAW_MATERIAL',
      quantityIssued: 10,
      issuedByName: 'John Stores',
      newItemStatus: 'ISSUED',
      newIndentStatus: 'PARTIAL',
    };

    await expect(service.handleItemIssued(dto)).rejects.toThrow(NotFoundException);
  });

  it('should update raw material item and log partial workflow history', async () => {
    mockPrisma.indent.findUnique.mockResolvedValue({
      id: 'indent-1',
      indentNumber: 'IND-100',
      departmentId: 'dsgn-dept-uuid',
      createdBy: 'creator-uuid',
      remarks: 'Initial notes',
    });

    const dto: ItemIssuedDto = {
      indentId: 'indent-1',
      indentNumber: 'IND-100',
      mercItemId: 'raw-item-1',
      itemType: 'RAW_MATERIAL',
      quantityIssued: 5,
      issuedByName: 'John Stores',
      newItemStatus: 'PARTIAL',
      newIndentStatus: 'PARTIAL',
    };

    const result = await service.handleItemIssued(dto);

    expect(result).toEqual({
      success: true,
      indentNumber: 'IND-100',
      updatedStatus: 'PARTIAL',
    });

    expect(mockPrisma.indentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'raw-item-1' },
        data: expect.objectContaining({
          issuedQuantity: { increment: 5 },
          status: 'AVAILABLE',
        }),
      }),
    );

    expect(mockPrisma.workflowHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          indentId: 'indent-1',
          remarks: expect.stringContaining('Partial issue from RM/V-Smart by John Stores'),
        }),
      }),
    );
  });

  it('should update brought-out item and auto-transition indent when all items issued', async () => {
    mockPrisma.indent.findUnique.mockResolvedValue({
      id: 'indent-1',
      indentNumber: 'IND-100',
      departmentId: 'dsgn-dept-uuid',
      createdBy: 'creator-uuid',
      remarks: 'Initial notes',
      product: { productName: 'Turbine Housing' },
    });

    const dto: ItemIssuedDto = {
      indentId: 'indent-1',
      indentNumber: 'IND-100',
      mercItemId: 'bo-item-1',
      itemType: 'BROUGHT_OUT',
      quantityIssued: 2,
      issuedByName: 'Alice Stores',
      newItemStatus: 'ISSUED',
      newIndentStatus: 'ISSUED',
    };

    const result = await service.handleItemIssued(dto);

    expect(result).toEqual({
      success: true,
      indentNumber: 'IND-100',
      updatedStatus: 'ISSUED',
    });

    expect(mockPrisma.indentBroughtMaterial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bo-item-1' },
        data: expect.objectContaining({
          issuedQuantity: { increment: 2 },
          status: 'ISSUED',
        }),
      }),
    );

    expect(mockPrisma.indent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'indent-1' },
        data: expect.objectContaining({
          status: 'PENDING_STORES',
          currentState: 'MATERIALS_ISSUED',
        }),
      }),
    );

    expect(mockPrisma.workflowHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          indentId: 'indent-1',
          toDepartmentId: 'prod-dept-uuid',
          remarks: expect.stringContaining(
            'All material items have been issued from RM/V-Smart by Alice Stores',
          ),
        }),
      }),
    );

    expect(mockPrisma.notification.create).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { InternalSecretGuard } from '../common/guards/internal-secret.guard';
import { ItemIssuedDto } from './dto/item-issued.dto';

describe('InternalController', () => {
  let controller: InternalController;
  let mockInternalService: any;

  beforeEach(async () => {
    mockInternalService = {
      handleItemIssued: jest.fn().mockResolvedValue({
        success: true,
        indentNumber: 'IND-001',
        updatedStatus: 'ISSUED',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalController],
      providers: [InternalSecretGuard, { provide: InternalService, useValue: mockInternalService }],
    }).compile();

    controller = module.get<InternalController>(InternalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    const health = controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('merc-internal-api');
    expect(health.timestamp).toBeDefined();
  });

  it('should handle item-issued callback from RM', async () => {
    const dto: ItemIssuedDto = {
      indentId: 'indent-1',
      indentNumber: 'IND-001',
      mercItemId: 'item-1',
      itemType: 'RAW_MATERIAL',
      quantityIssued: 5,
      issuedByName: 'RM User',
      newItemStatus: 'ISSUED',
      newIndentStatus: 'ISSUED',
    };

    const result = await controller.handleItemIssued(dto);
    expect(result).toEqual({
      success: true,
      indentNumber: 'IND-001',
      updatedStatus: 'ISSUED',
    });
    expect(mockInternalService.handleItemIssued).toHaveBeenCalledWith(dto);
  });
});

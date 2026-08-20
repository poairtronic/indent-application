import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowStateMachineService } from '../services/workflow-state-machine.service';
import { WorkflowStateTransitionValidator } from '../validators/workflow-state-transition.validator';
import { WorkflowState } from '../enums/workflow-state.enum';

describe('WorkflowStateMachineService (T1-B)', () => {
  let service: WorkflowStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowStateMachineService, WorkflowStateTransitionValidator],
    }).compile();

    service = module.get<WorkflowStateMachineService>(WorkflowStateMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Valid Transitions (Loop 1)', () => {
    it('should allow DRAFT to DESIGN_COMPLETED by DESIGN department', () => {
      const result = service.validateTransition(
        WorkflowState.DRAFT,
        WorkflowState.DESIGN_COMPLETED,
        'DESIGN',
      );
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should allow DESIGN_COMPLETED to STORES_PROCESSING by STORES department', () => {
      const result = service.validateTransition(
        WorkflowState.DESIGN_COMPLETED,
        WorkflowState.STORES_PROCESSING,
        'STORES', // Target department is STORES, wait, validator checks targetDef.owningDepartmentCode === userDepartmentCode
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow STORES_PROCESSING to MATERIALS_ISSUED by STORES department', () => {
      const result = service.validateTransition(
        WorkflowState.STORES_PROCESSING,
        WorkflowState.MATERIALS_ISSUED,
        'STORES',
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow MATERIALS_ISSUED to PRODUCTION_PROCESSING by PRODUCTION department', () => {
      const result = service.validateTransition(
        WorkflowState.MATERIALS_ISSUED,
        WorkflowState.PRODUCTION_PROCESSING,
        'PRODUCTION',
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow PRODUCTION_PROCESSING to PRODUCTION_COMPLETED by PRODUCTION department', () => {
      const result = service.validateTransition(
        WorkflowState.PRODUCTION_PROCESSING,
        WorkflowState.PRODUCTION_COMPLETED,
        'PRODUCTION',
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Valid Transitions (Loop 2)', () => {
    it('should allow PRODUCTION_COMPLETED to ACCOUNTS_COST_VERIFICATION by ACCOUNTS department', () => {
      const result = service.validateTransition(
        WorkflowState.PRODUCTION_COMPLETED,
        WorkflowState.ACCOUNTS_COST_VERIFICATION,
        'ACCOUNTS',
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow ACCOUNTS_COST_VERIFICATION to ACTUAL_COST_UPDATED by ACCOUNTS department', () => {
      const result = service.validateTransition(
        WorkflowState.ACCOUNTS_COST_VERIFICATION,
        WorkflowState.ACTUAL_COST_UPDATED,
        'ACCOUNTS',
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow ACTUAL_COST_UPDATED to ACCOUNTS_FINANCIAL_CLOSURE by ACCOUNTS department', () => {
      const result = service.validateTransition(
        WorkflowState.ACTUAL_COST_UPDATED,
        WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
        'ACCOUNTS',
      );
      expect(result.isValid).toBe(true);
    });

    it('should allow SYSTEM to archive and complete', () => {
      let result = service.validateTransition(
        WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
        WorkflowState.ARCHIVED,
        'SYSTEM',
      );
      expect(result.isValid).toBe(true);

      result = service.validateTransition(
        WorkflowState.ARCHIVED,
        WorkflowState.COMPLETED,
        'SYSTEM',
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject backward transitions (e.g. MATERIALS_ISSUED to STORES_PROCESSING)', () => {
      const result = service.validateTransition(
        WorkflowState.MATERIALS_ISSUED,
        WorkflowState.STORES_PROCESSING,
        'STORES',
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('not allowed');
    });

    it('should reject skipping states (e.g. DRAFT to STORES_PROCESSING)', () => {
      const result = service.validateTransition(
        WorkflowState.DRAFT,
        WorkflowState.STORES_PROCESSING,
        'STORES',
      );
      expect(result.isValid).toBe(false);
    });

    it('should reject any transition from a terminal state (COMPLETED)', () => {
      const result = service.validateTransition(
        WorkflowState.COMPLETED,
        WorkflowState.DRAFT,
        'DESIGN',
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('terminal state');
    });

    it('should reject transitions by wrong department', () => {
      const result = service.validateTransition(
        WorkflowState.DRAFT,
        WorkflowState.DESIGN_COMPLETED,
        'PRODUCTION', // DESIGN is required
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('not authorized to trigger transition');
    });
  });

  describe('Legacy State Rejection (Customer Delivery)', () => {
    it('should strictly reject PRODUCTION_COMPLETED to CUSTOMER_DELIVERED', () => {
      // simulate an old string value being passed
      const legacyState = 'CUSTOMER_DELIVERED' as WorkflowState;
      const result = service.validateTransition(
        WorkflowState.PRODUCTION_COMPLETED,
        legacyState,
        'PRODUCTION',
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid target workflow state');
    });
  });
});

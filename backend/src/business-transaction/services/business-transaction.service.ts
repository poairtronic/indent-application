import { Injectable } from '@nestjs/common';
import { BusinessTransactionValidator } from '../validators/business-transaction.validator';
import { CreateBusinessTransactionDto } from '../dto/create-business-transaction.dto';
import {
  IBusinessTransaction,
  IBusinessValidationResult,
} from '../interfaces/business-transaction.interface';
import { WorkflowState, WorkflowLoop } from '../enums/workflow-state.enum';

/**
 * BusinessTransactionService Foundation (Phase 12A - Structure Only)
 * Establishes domain service signatures for Business Transaction composite entity.
 * Execution logic and database CRUD are omitted per Phase 12A boundary rules.
 */
@Injectable()
export class BusinessTransactionService {
  constructor(private readonly businessTransactionValidator: BusinessTransactionValidator) {}

  /**
   * Validate Business Transaction structure and material/process synchronicity.
   */
  public validateTransaction(dto: CreateBusinessTransactionDto): IBusinessValidationResult {
    return this.businessTransactionValidator.validate(dto);
  }

  /**
   * Signature for initial Business Transaction foundation structure.
   */
  public createFoundationStructure(
    dto: CreateBusinessTransactionDto,
    _userId: string,
  ): Partial<IBusinessTransaction> {
    const validationResult = this.validateTransaction(dto);
    if (!validationResult.isValid) {
      throw new Error(
        `Business Transaction validation failed: ${validationResult.errors.join(', ')}`,
      );
    }

    return {
      currentState: WorkflowState.DRAFT,
      currentLoop: WorkflowLoop.MANUFACTURING_LOOP,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

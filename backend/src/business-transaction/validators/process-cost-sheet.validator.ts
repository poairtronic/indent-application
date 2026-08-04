import { Injectable } from '@nestjs/common';
import { CreateProcessCostSheetDto } from '../dto/create-process-cost-sheet.dto';
import { IBusinessValidationResult } from '../interfaces/business-transaction.interface';

@Injectable()
export class ProcessCostSheetValidator {
  public validate(dto: CreateProcessCostSheetDto): IBusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (dto.predictedTotal === undefined || dto.predictedTotal < 0) {
      errors.push('Predicted total cost must be a non-negative number.');
    }

    if (!dto.costItems || dto.costItems.length === 0) {
      errors.push('Process Cost Sheet must contain at least one material cost item.');
    } else {
      dto.costItems.forEach((item, index) => {
        if (item.predictedRate < 0) {
          errors.push(`Material Cost Item #${index + 1}: Predicted rate cannot be negative.`);
        }
        if (item.predictedQuantity <= 0) {
          errors.push(`Material Cost Item #${index + 1}: Predicted quantity must be positive.`);
        }
      });
    }

    if (!dto.processCosts || dto.processCosts.length === 0) {
      errors.push(
        'Process Cost Sheet must contain at least one manufacturing process cost structure.',
      );
    } else {
      dto.processCosts.forEach((process, index) => {
        if (!process.processId) {
          errors.push(`Manufacturing Process Cost #${index + 1}: Process ID is required.`);
        }
        if (process.predictedCost < 0) {
          errors.push(
            `Manufacturing Process Cost #${index + 1}: Predicted cost cannot be negative.`,
          );
        }
        if (process.estimatedHours < 0) {
          errors.push(
            `Manufacturing Process Cost #${index + 1}: Estimated hours cannot be negative.`,
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

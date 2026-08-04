import { Injectable } from '@nestjs/common';
import { CreateBusinessTransactionDto } from '../dto/create-business-transaction.dto';
import { IndentSheetValidator } from './indent-sheet.validator';
import { ProcessCostSheetValidator } from './process-cost-sheet.validator';
import { IBusinessValidationResult } from '../interfaces/business-transaction.interface';

@Injectable()
export class BusinessTransactionValidator {
  constructor(
    private readonly indentSheetValidator: IndentSheetValidator,
    private readonly processCostSheetValidator: ProcessCostSheetValidator,
  ) {}

  public validate(dto: CreateBusinessTransactionDto): IBusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dto.indent) {
      errors.push('Business Transaction requires a valid Indent Sheet specification.');
    }
    if (!dto.costSheet) {
      errors.push('Business Transaction requires a valid Process Cost Sheet specification.');
    }

    if (dto.indent) {
      const indentResult = this.indentSheetValidator.validate(dto.indent);
      errors.push(...indentResult.errors);
      warnings.push(...indentResult.warnings);
    }

    if (dto.costSheet) {
      const costResult = this.processCostSheetValidator.validate(dto.costSheet);
      errors.push(...costResult.errors);
      warnings.push(...costResult.warnings);
    }

    // Synchronicity check: materials listed in Indent Sheet must be present in Process Cost Sheet
    if (dto.indent && dto.costSheet && dto.indent.items && dto.costSheet.costItems) {
      if (dto.indent.items.length !== dto.costSheet.costItems.length) {
        warnings.push(
          'Indent Sheet material count does not match Process Cost Sheet material cost item count.',
        );
      } else {
        dto.indent.items.forEach((item, index) => {
          const costItem = dto.costSheet!.costItems[index];
          const indentName = item.materialName.trim();
          const costName = costItem.materialName?.trim() || indentName;
          if (indentName !== costName) {
            warnings.push(
              `Material '${indentName}' at row #${index + 1} does not match Process Cost Sheet entry '${costName}'.`,
            );
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

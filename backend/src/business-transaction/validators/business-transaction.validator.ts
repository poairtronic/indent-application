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
      const indentMaterials = new Set(dto.indent.items.map((i) => i.materialId));
      const costMaterials = new Set(dto.costSheet.costItems.map((c) => c.materialId));

      indentMaterials.forEach((materialId) => {
        if (!costMaterials.has(materialId)) {
          warnings.push(
            `Material ID ${materialId} is specified in Indent Sheet but missing in Process Cost Sheet planned costs.`,
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

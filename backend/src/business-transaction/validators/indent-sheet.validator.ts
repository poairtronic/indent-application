import { Injectable } from '@nestjs/common';
import { CreateIndentSheetDto } from '../dto/create-indent-sheet.dto';
import { IBusinessValidationResult } from '../interfaces/business-transaction.interface';

@Injectable()
export class IndentSheetValidator {
  public validate(dto: CreateIndentSheetDto): IBusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dto.productId) {
      errors.push('Product ID is required for Indent Sheet.');
    }

    if (!dto.departmentId) {
      errors.push('Department ID is required for Indent Sheet.');
    }

    if (!dto.items || dto.items.length === 0) {
      errors.push('Indent Sheet must contain at least one material item.');
    } else {
      dto.items.forEach((item, index) => {
        if (!item.materialId) {
          errors.push(`Item #${index + 1}: Material ID is required.`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item #${index + 1}: Quantity must be greater than zero.`);
        }
        if (!item.unitId) {
          errors.push(`Item #${index + 1}: Unit of Measure ID is required.`);
        }
      });
    }

    if (dto.requiredDate) {
      const required = new Date(dto.requiredDate);
      const now = new Date();
      if (isNaN(required.getTime())) {
        errors.push('Required Date must be a valid date.');
      } else if (required < now) {
        warnings.push('Required Date is in the past.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

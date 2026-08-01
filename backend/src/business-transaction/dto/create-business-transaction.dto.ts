import { ValidateNested, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIndentSheetDto, UpdateIndentSheetDto } from './create-indent-sheet.dto';
import {
  CreateProcessCostSheetDto,
  UpdateProcessCostSheetDto,
} from './create-process-cost-sheet.dto';
import { WorkflowState, WorkflowLoop } from '../enums/workflow-state.enum';

export class CreateBusinessTransactionDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateIndentSheetDto)
  indent: CreateIndentSheetDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateProcessCostSheetDto)
  costSheet: CreateProcessCostSheetDto;
}

export class UpdateBusinessTransactionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIndentSheetDto)
  indent?: UpdateIndentSheetDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProcessCostSheetDto)
  costSheet?: UpdateProcessCostSheetDto;
}

export class BusinessTransactionResponseDto {
  id: string;
  indentNumber: string;
  costNumber: string;
  productId: string;
  departmentId: string;
  currentState: WorkflowState;
  currentLoop: WorkflowLoop;
  isLocked: boolean;
  predictedTotalCost: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { FileType } from '../enums/workflow-state.enum';

export class AddAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;
}

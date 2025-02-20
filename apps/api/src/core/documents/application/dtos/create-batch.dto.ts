import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OutputFormat } from '@/core/documents/domain/types/output-format.type';
import { FileFormat } from '../../domain/constants/file-formats';

export class FileDto {
  @IsString()
  @IsNotEmpty()
  data: Buffer;

  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsOptional()
  files?: FileDto[];

  @IsArray()
  @IsOptional()
  outputFormats?: OutputFormat[] = [FileFormat.JSON];
}

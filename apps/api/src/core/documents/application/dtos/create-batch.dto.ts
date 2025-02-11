import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}

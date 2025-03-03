import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CalculateBatchCostDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  processCode?: string;
}

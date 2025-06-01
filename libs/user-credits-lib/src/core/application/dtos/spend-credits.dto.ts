import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class SpendCreditsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  operationId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

import { IsString, IsNumber, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class ConfigureAutoTopupDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  threshold: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

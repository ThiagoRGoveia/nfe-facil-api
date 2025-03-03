import { IsString, IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionInterval } from '../../domain/entities/credit-subscription.entity';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  creditAmount: number;

  @IsEnum(SubscriptionInterval)
  @IsNotEmpty()
  interval: SubscriptionInterval;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

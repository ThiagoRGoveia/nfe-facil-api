import { IsString, IsNotEmpty } from 'class-validator';

export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class CreateUserCreditDto {
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  balance: number;
}

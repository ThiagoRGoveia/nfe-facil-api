import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateBatchDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @Field({ nullable: true })
  @IsOptional()
  file?: Buffer;

  @Field({ nullable: true })
  @IsOptional()
  fileName?: string;
}

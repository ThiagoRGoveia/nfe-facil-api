import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';

@InputType()
export class CreateBatchInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @Field(() => [GraphQLUpload], { nullable: true })
  @IsOptional()
  files?: Promise<FileUpload>[];
}

import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { FileUpload } from 'graphql-upload/processRequest.mjs';

@InputType()
export class CreateBatchInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @Field(() => GraphQLUpload, { nullable: true })
  @IsOptional()
  file?: Promise<FileUpload>;
}

import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';
import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';

registerEnumType(FileFormat, {
  name: 'FileFormat',
  description: 'The format of the file',
});

@InputType()
export class CreateBatchInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @Field(() => [GraphQLUpload], { nullable: true })
  @IsOptional()
  files?: Promise<FileUpload>[];

  @Field(() => [FileFormat], { nullable: true })
  @IsOptional()
  outputFormats?: FileFormat[] = [FileFormat.JSON];
}

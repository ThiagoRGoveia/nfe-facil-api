import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class UpdateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Invoice Template',
    required: false,
  })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Process code that identifies the workflow to be used',
    example: 'invoice-extractor',
    required: false,
  })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  processCode?: string;

  @ApiProperty({
    description: 'Metadata configuration for the template processing',
    example: { fields: ['date', 'total', 'items'] },
    required: false,
  })
  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Output format for the processed data',
    example: 'json',
    required: false,
  })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  outputFormat?: string;
}

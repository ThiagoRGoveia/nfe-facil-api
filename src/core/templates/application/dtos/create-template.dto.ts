import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateTemplateDto {
  @Field(() => String)
  @ApiProperty({
    description: 'Template name',
    example: 'Invoice Template',
  })
  @IsString()
  name: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Process code that identifies the workflow to be used',
    example: 'invoice-extractor',
  })
  @IsString()
  processCode: string;

  @Field(() => GraphQLJSON)
  @ApiProperty({
    description: 'Metadata configuration for the template processing',
    example: { fields: ['date', 'total', 'items'] },
  })
  @IsObject()
  metadata: Record<string, unknown>;

  @Field(() => String)
  @ApiProperty({
    description: 'Output format for the processed data',
    example: 'json',
  })
  @IsString()
  outputFormat: string;

  @Field(() => Boolean, { nullable: true })
  @ApiProperty({
    description: 'Whether the template is public or private',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic: boolean = false;
}

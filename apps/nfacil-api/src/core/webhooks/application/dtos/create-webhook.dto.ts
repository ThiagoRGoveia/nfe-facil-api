import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { WebhookAuthType, WebhookEvent } from '../../domain/entities/webhook.entity';

@InputType()
export class CreateWebhookDto {
  @Field(() => String)
  @ApiProperty({
    description: 'Webhook name',
    example: 'Invoice Processing Webhook',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Target URL for webhook notifications',
    example: 'https://api.example.com/webhooks',
  })
  @IsUrl()
  url: string;

  @Field(() => [WebhookEvent])
  @ApiProperty({
    description: 'List of events to subscribe to',
    example: ['document.processed', 'invoice.paid'],
    enum: WebhookEvent,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @Field(() => WebhookAuthType)
  @ApiProperty({
    description: 'Authentication type for the webhook',
    enum: WebhookAuthType,
  })
  @IsEnum(WebhookAuthType)
  authType: WebhookAuthType;

  @Field(() => GraphQLJSON, { nullable: true })
  @ApiProperty({
    description: 'Authentication configuration (if required)',
    example: { apiKey: 'secret-key' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  authConfig?: Record<string, string>;

  @Field(() => GraphQLJSON, { nullable: true })
  @ApiProperty({
    description: 'Custom headers for the webhook request',
    example: { 'X-Custom-Header': 'value' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @Field(() => Number, { nullable: true })
  @ApiProperty({
    description: 'Maximum number of retries for the webhook',
    example: 3,
    required: false,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number = 5;

  @Field(() => Number, { nullable: true })
  @ApiProperty({
    description: 'Timeout for the webhook request',
    example: 5000,
    required: false,
    default: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(10000)
  timeout?: number = 5000;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { WebhookAuthType, WebhookEvent } from '../../domain/entities/webhook.entity';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class UpdateWebhookDto {
  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'Webhook name',
    example: 'Invoice Processing Webhook',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'Target URL for webhook notifications',
    example: 'https://api.example.com/webhooks',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  url?: string;

  @Field(() => [WebhookEvent], { nullable: true })
  @ApiProperty({
    description: 'List of events to subscribe to',
    example: ['document.processed', 'invoice.paid'],
    enum: WebhookEvent,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @Field(() => WebhookAuthType, { nullable: true })
  @ApiProperty({
    description: 'Authentication type for the webhook',
    enum: WebhookAuthType,
    required: false,
  })
  @IsEnum(WebhookAuthType)
  @IsOptional()
  authType?: WebhookAuthType;

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

  @Field(() => Boolean, { nullable: true })
  @ApiProperty({
    description: 'Whether the webhook is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active: boolean = true;
}

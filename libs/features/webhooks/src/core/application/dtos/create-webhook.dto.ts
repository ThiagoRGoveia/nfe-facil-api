import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
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
  ValidateNested,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { WebhookAuthType, WebhookEvent } from '../../domain/entities/webhook.entity';
import { Type } from 'class-transformer';

@InputType()
export class BasicAuthConfigInput {
  @Field(() => String)
  @ApiProperty({
    description: 'Username for basic authentication',
    example: 'username',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Password for basic authentication',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class OAuth2ConfigInput {
  @Field(() => String)
  @ApiProperty({
    description: 'Client ID for OAuth2 authentication',
    example: 'client-id',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Client secret for OAuth2 authentication',
    example: 'client-secret',
  })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Token URL for OAuth2 authentication',
    example: 'https://auth.example.com/token',
  })
  @IsUrl()
  tokenUrl: string;
}

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
    oneOf: [{ $ref: getSchemaPath(BasicAuthConfigInput) }, { $ref: getSchemaPath(OAuth2ConfigInput) }],
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type((options) => {
    const authType = (options?.object as CreateWebhookDto)?.authType;
    if (authType === WebhookAuthType.BASIC) return BasicAuthConfigInput;
    if (authType === WebhookAuthType.OAUTH2) return OAuth2ConfigInput;
    return Object;
  })
  authConfig?: BasicAuthConfigInput | OAuth2ConfigInput;

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

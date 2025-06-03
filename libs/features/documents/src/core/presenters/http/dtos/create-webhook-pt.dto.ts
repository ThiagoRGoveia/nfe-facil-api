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
import { WebhookAuthType, WebhookEvent } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { Type } from 'class-transformer';

export class BasicAuthConfigInputPt {
  @ApiProperty({
    description: 'Nome de usuário para autenticação básica',
    example: 'usuario',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Senha para autenticação básica',
    example: 'senha',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OAuth2ConfigInputPt {
  @ApiProperty({
    description: 'ID do cliente para autenticação OAuth2',
    example: 'client-id',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Segredo do cliente para autenticação OAuth2',
    example: 'client-secret',
  })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({
    description: 'URL de token para autenticação OAuth2',
    example: 'https://auth.exemplo.com.br/token',
  })
  @IsUrl()
  tokenUrl: string;
}

export class CreateWebhookPtDto {
  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Processamento de Notas Fiscais',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL de destino para as notificações do webhook',
    example: 'https://api.exemplo.com.br/webhooks',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Lista de eventos para se inscrever',
    example: ['document.processed', 'invoice.paid'],
    enum: WebhookEvent,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiProperty({
    description: 'Tipo de autenticação para o webhook',
    enum: WebhookAuthType,
  })
  @IsEnum(WebhookAuthType)
  authType: WebhookAuthType;

  @ApiProperty({
    description: 'Configuração de autenticação (se necessário)',
    oneOf: [{ $ref: getSchemaPath(BasicAuthConfigInputPt) }, { $ref: getSchemaPath(OAuth2ConfigInputPt) }],
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type((options) => {
    const authType = (options?.object as CreateWebhookPtDto)?.authType;
    if (authType === WebhookAuthType.BASIC) return BasicAuthConfigInputPt;
    if (authType === WebhookAuthType.OAUTH2) return OAuth2ConfigInputPt;
    return Object;
  })
  authConfig?: BasicAuthConfigInputPt | OAuth2ConfigInputPt;

  @ApiProperty({
    description: 'Cabeçalhos personalizados para a requisição do webhook',
    example: { 'X-Cabecalho-Personalizado': 'valor' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Número máximo de tentativas para o webhook',
    example: 3,
    required: false,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number = 5;

  @ApiProperty({
    description: 'Tempo limite para a requisição do webhook (em milissegundos)',
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

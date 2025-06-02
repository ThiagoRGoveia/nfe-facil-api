import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import { WebhookAuthType, WebhookEvent } from '@lib/webhooks/core/domain/entities/webhook.entity';

export class UpdateWebhookPtDto {
  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Processamento de Notas Fiscais',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL de destino para as notificações do webhook',
    example: 'https://api.exemplo.com.br/webhooks',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'Lista de eventos para se inscrever',
    example: ['document.processed', 'invoice.paid'],
    enum: WebhookEvent,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @ApiProperty({
    description: 'Tipo de autenticação para o webhook',
    enum: WebhookAuthType,
    required: false,
  })
  @IsEnum(WebhookAuthType)
  @IsOptional()
  authType?: WebhookAuthType;

  @ApiProperty({
    description: 'Configuração de autenticação (se necessário)',
    example: { apiKey: 'chave-secreta' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  authConfig?: Record<string, string>;

  @ApiProperty({
    description: 'Cabeçalhos personalizados para a requisição do webhook',
    example: { 'X-Cabecalho-Personalizado': 'valor' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Indica se o webhook está ativo',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active: boolean = true;
}

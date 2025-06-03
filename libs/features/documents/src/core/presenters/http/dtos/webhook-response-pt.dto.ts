import { ApiProperty } from '@nestjs/swagger';
import { WebhookAuthType, WebhookEvent } from '@lib/webhooks/core/domain/entities/webhook.entity';

export class WebhookResponsePtDto {
  @ApiProperty({
    description: 'Identificador único do webhook',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Processamento de Notas Fiscais',
  })
  name: string;

  @ApiProperty({
    description: 'URL de destino para as notificações do webhook',
    example: 'https://api.exemplo.com.br/webhooks',
  })
  url: string;

  @ApiProperty({
    description: 'Lista de eventos inscritos',
    example: ['document.processed', 'invoice.paid'],
    enum: WebhookEvent,
    isArray: true,
  })
  events: WebhookEvent[];

  @ApiProperty({
    description: 'Tipo de autenticação para o webhook',
    enum: WebhookAuthType,
  })
  authType: WebhookAuthType;

  @ApiProperty({
    description: 'Configuração de autenticação (valores sensíveis mascarados)',
    example: { username: '******', password: '******' },
    required: false,
  })
  authConfig?: Record<string, string>;

  @ApiProperty({
    description: 'Cabeçalhos personalizados para a requisição do webhook',
    example: { 'X-Cabecalho-Personalizado': 'valor' },
    required: false,
  })
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Número máximo de tentativas para o webhook',
    example: 3,
  })
  maxRetries: number;

  @ApiProperty({
    description: 'Tempo limite para a requisição do webhook (em milissegundos)',
    example: 5000,
  })
  timeout: number;

  @ApiProperty({
    description: 'Indica se o webhook está ativo',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Identificador do usuário que criou o webhook',
    example: '12345678-90ab-cdef-1234-567890abcdef',
  })
  userId: string;

  @ApiProperty({
    description: 'Data de criação do webhook',
    example: '2023-09-15T14:30:15.123Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do webhook',
    example: '2023-09-15T14:30:15.123Z',
  })
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';

export class DocumentProcessedPayloadPtDto {
  @ApiProperty({
    description: 'Identificador único do documento processado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'Status do processamento do documento',
    example: 'PROCESSED',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Nome do arquivo processado',
    example: 'nfse_12345.pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Data e hora do processamento',
    example: '2023-09-15T14:30:15.123Z',
  })
  @IsNotEmpty()
  @IsString()
  processedAt: string;

  @ApiProperty({
    description: 'Identificador do lote ao qual o documento pertence',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  batchId: string;

  @ApiProperty({
    description: 'Resultado do processamento com os dados extraídos',
    example: { chave_acesso_nfse: '12345678901234567890', numero_nfse: '123456' },
  })
  @IsNotEmpty()
  @IsObject()
  result: Record<string, any>;
}

export class DocumentFailedPayloadPtDto {
  @ApiProperty({
    description: 'Identificador único do documento que falhou no processamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'Mensagem de erro que ocorreu durante o processamento',
    example: 'Não foi possível extrair os dados do documento: formato inválido',
  })
  @IsNotEmpty()
  @IsString()
  error: string;

  @ApiProperty({
    description: 'Nome do arquivo que falhou',
    example: 'nfse_12345.pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Data e hora da falha',
    example: '2023-09-15T14:30:15.123Z',
  })
  @IsNotEmpty()
  @IsString()
  failedAt: string;

  @ApiProperty({
    description: 'Identificador do lote ao qual o documento pertence',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  batchId: string;
}

export class BatchFinishedPayloadPtDto {
  @ApiProperty({
    description: 'Identificador único do lote finalizado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  batchId: string;
}

export class NotifyWebhookPtDto {
  @ApiProperty({
    description: 'Tipo de evento de webhook a ser notificado',
    enum: WebhookEvent,
    example: WebhookEvent.DOCUMENT_PROCESSED,
  })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({
    description: 'Carga útil do evento de webhook (payload)',
    example: {
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'PROCESSED',
      fileName: 'nfse_12345.pdf',
      processedAt: '2023-09-15T14:30:15.123Z',
      batchId: '123e4567-e89b-12d3-a456-426614174001',
      result: {
        /* dados da NFSe */
      },
    },
  })
  @IsObject()
  payload: DocumentProcessedPayloadPtDto | DocumentFailedPayloadPtDto | BatchFinishedPayloadPtDto;

  @ApiProperty({
    description: 'ID específico do webhook para notificar (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsString()
  @IsOptional()
  webhookId?: string;
}

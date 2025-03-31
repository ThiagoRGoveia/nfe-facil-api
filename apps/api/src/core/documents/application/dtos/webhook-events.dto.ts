import { NfseDto } from '@doc/core/workflows/nfe/dto/nfse.dto';
import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsObject, IsDateString, ValidateNested, IsEnum } from 'class-validator';

export enum WebhookEvent {
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  DOCUMENT_FAILED = 'DOCUMENT_FAILED',
  BATCH_FINISHED = 'BATCH_FINISHED',
}

/**
 * DTO para payload de documento processado com sucesso
 */
export class DocumentProcessedPayloadDto {
  @ApiProperty({
    description: 'ID único do documento processado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'Status do processamento',
    example: 'PROCESSED',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Nome do arquivo processado',
    example: 'nfse_12345.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Data e hora do processamento',
    example: '2023-09-15T14:30:15.123Z',
  })
  @IsDateString()
  processedAt: string;

  @ApiProperty({
    description: 'ID do lote ao qual o documento pertence',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  batchId: string;

  @ApiProperty({
    description: 'Resultado da extração dos dados da NFSe',
    type: NfseDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NfseDto)
  result: NfseDto;
}

/**
 * DTO para payload de documento com falha no processamento
 */
export class DocumentFailedPayloadDto {
  @ApiProperty({
    description: 'ID único do documento com falha',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'Mensagem de erro detalhada',
    example: 'Não foi possível extrair os dados do documento: formato inválido',
  })
  @IsString()
  error: string;

  @ApiProperty({
    description: 'Nome do arquivo com falha',
    example: 'nfse_12345.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Data e hora da falha',
    example: '2023-09-15T14:30:15.123Z',
  })
  @IsDateString()
  failedAt: string;

  @ApiProperty({
    description: 'ID do lote ao qual o documento pertence',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  batchId: string;
}

/**
 * DTO para payload de lote finalizado
 */
export class BatchFinishedPayloadDto {
  @ApiProperty({
    description: 'ID único do lote finalizado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  batchId: string;
}

/**
 * DTO base para notificações de webhook
 *
 * Na entrega do webhook, os seguintes campos adicionais são incluídos:
 * - event: Tipo do evento (WebhookEvent) identificando o tipo de notificação
 * - timestamp: Data e hora ISO 8601 em que a notificação foi enviada
 */
@ApiExtraModels(DocumentProcessedPayloadDto, DocumentFailedPayloadDto, BatchFinishedPayloadDto)
export class WebhookNotificationDto {
  @ApiProperty({
    description: 'Tipo de evento da notificação',
    enum: WebhookEvent,
    example: WebhookEvent.DOCUMENT_PROCESSED,
  })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({
    description: 'Data e hora do envio da notificação',
    example: '2023-09-15T14:30:15.123Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Dados específicos do evento',
    oneOf: [
      { $ref: '#/components/schemas/DocumentProcessedPayloadDto' },
      { $ref: '#/components/schemas/DocumentFailedPayloadDto' },
      { $ref: '#/components/schemas/BatchFinishedPayloadDto' },
    ],
  })
  @IsObject()
  @ValidateNested()
  @Type((options) => {
    if (options?.object?.event === WebhookEvent.DOCUMENT_PROCESSED) {
      return DocumentProcessedPayloadDto;
    } else if (options?.object?.event === WebhookEvent.DOCUMENT_FAILED) {
      return DocumentFailedPayloadDto;
    } else if (options?.object?.event === WebhookEvent.BATCH_FINISHED) {
      return BatchFinishedPayloadDto;
    }
    return Object;
  })
  payload: DocumentProcessedPayloadDto | DocumentFailedPayloadDto | BatchFinishedPayloadDto;
}

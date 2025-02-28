import { NfseDto } from '@doc/workflows/nfe/dto/nfse.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para o payload de notificação quando um documento NFSe é processado com sucesso
 */
export class DocumentProcessedPayloadDto {
  @ApiProperty({
    description: 'ID do documento processado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  documentId: string;

  @ApiProperty({
    description: 'Status atual do documento',
    example: 'PROCESSED',
  })
  status: string;

  @ApiProperty({
    description: 'Nome do arquivo original',
    example: 'nfse_12345.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'Data e hora do processamento',
    example: '2023-09-15T14:30:15.123Z',
  })
  processedAt: Date;

  @ApiProperty({
    description: 'ID do lote ao qual o documento pertence (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  batchId?: string;

  @ApiProperty({
    description: 'Dados extraídos da NFSe',
    type: () => NfseDto,
  })
  result: NfseDto;
}

/**
 * DTO para o payload de notificação quando ocorre falha no processamento de um documento NFSe
 */
export class DocumentFailedPayloadDto {
  @ApiProperty({
    description: 'ID do documento que falhou',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  documentId: string;

  @ApiProperty({
    description: 'Mensagem de erro que ocorreu durante o processamento',
    example: 'Não foi possível extrair os dados do documento: formato inválido',
  })
  error: string;

  @ApiProperty({
    description: 'Nome do arquivo original',
    example: 'nfse_12345.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'Data e hora da falha',
    example: '2023-09-15T14:30:15.123Z',
  })
  failedAt: Date;

  @ApiProperty({
    description: 'ID do lote ao qual o documento pertence (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  batchId?: string;
}

/**
 * DTO para o payload de notificação quando um lote completo de NFSe é finalizado
 */
export class BatchFinishedPayloadDto {
  @ApiProperty({
    description: 'ID do lote finalizado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  batchId: string;
}

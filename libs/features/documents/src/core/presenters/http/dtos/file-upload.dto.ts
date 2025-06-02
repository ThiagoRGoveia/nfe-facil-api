import { ApiProperty } from '@nestjs/swagger';
import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';
import { OutputFormat } from '@lib/documents/core/domain/types/output-format.type';

/**
 * DTO para envio de arquivos via multipart/form-data
 *
 * Este DTO define a estrutura para upload de arquivos nos endpoints
 * que aceitam arquivos de documentos fiscais eletrônicos.
 */
export class FileUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Lista de arquivos a serem processados. Aceita PDFs e ZIPs contendo PDFs.',
    required: true,
  })
  files: Buffer[];
}

/**
 * DTO para envio de arquivos com configurações adicionais
 *
 * Este DTO estende o FileUploadDto básico, adicionando opções de configuração
 * para o processamento dos arquivos.
 */
export class FileUploadWithConfigDto extends FileUploadDto {
  @ApiProperty({
    type: 'string',
    description: 'Tipo de documento fiscal a ser processado',
    enum: ['NFSE', 'NFE', 'NFCE', 'CTE'],
    example: 'NFSE',
    required: true,
  })
  documentType: string;

  @ApiProperty({
    type: 'boolean',
    description: 'Indica se deve validar estruturalmente o documento',
    default: true,
    required: false,
  })
  validateStructure?: boolean;

  @ApiProperty({
    type: 'integer',
    description: 'Prioridade de processamento (1-5, sendo 5 a maior prioridade)',
    minimum: 1,
    maximum: 5,
    default: 3,
    required: false,
  })
  priority?: number;
}

/**
 * DTO para envio opcional de arquivos
 *
 * Similar ao FileUploadDto, mas com a propriedade files marcada como opcional.
 * Útil para endpoints que permitem criação de recursos sem arquivos iniciais.
 */
export class OptionalFileUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Lista opcional de arquivos a serem processados. Aceita PDFs e ZIPs contendo PDFs.',
    required: false,
  })
  files?: any[];
}

/**
 * DTO para envio de arquivos com formatos de saída específicos
 *
 * Estende o OptionalFileUploadDto, adicionando a capacidade de especificar
 * quais formatos de saída devem ser gerados durante o processamento.
 */
export class FileUploadWithFormatsDto extends OptionalFileUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(FileFormat),
    },
    description: 'Formatos de saída desejados (json, csv, xlsx)',
    example: ['json', 'csv'],
    required: false,
  })
  outputFormats?: OutputFormat[];
}

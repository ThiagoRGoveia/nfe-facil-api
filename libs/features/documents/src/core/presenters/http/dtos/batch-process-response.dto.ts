import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';

export class BatchProcessResponseDto {
  @ApiProperty({
    description: 'Identificador único do lote de processamento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Status atual do lote de processamento',
    example: 'PROCESSING',
    enum: BatchStatus,
  })
  @Expose()
  status: BatchStatus;

  @ApiProperty({
    description: 'Identificador único do template utilizado para processamento',
    example: 'd7e8f9a0-b1c2-3456-d7e8-f9a0b1c23456',
  })
  @Expose()
  template: string;

  @ApiProperty({
    description: 'Identificador único do usuário que criou o lote',
    example: '12345678-90ab-cdef-1234-567890abcdef',
  })
  @Expose()
  user: string;

  @ApiProperty({
    description: 'Número total de arquivos no lote',
    example: 10,
  })
  @Expose()
  totalFiles: number;

  @ApiProperty({
    description: 'Número de arquivos já processados',
    example: 5,
  })
  @Expose()
  processedFiles: number;

  @ApiProperty({
    description: 'Formatos de saída solicitados',
    example: ['JSON', 'CSV'],
    isArray: true,
  })
  @Expose()
  requestedFormats: string[];

  @ApiProperty({
    description: 'Resultados em formato JSON (disponível após processamento)',
    example: '{"results": [...]}',
    nullable: true,
  })
  @Expose()
  jsonResults?: string;

  @ApiProperty({
    description: 'Resultados em formato CSV (disponível após processamento)',
    example: 'id,nome,valor\n1,item1,100.00\n2,item2,200.00',
    nullable: true,
  })
  @Expose()
  csvResults?: string;

  @ApiProperty({
    description: 'Resultados em formato Excel (disponível após processamento)',
    example: 'base64-encoded-excel-content',
    nullable: true,
  })
  @Expose()
  excelResults?: string;
}

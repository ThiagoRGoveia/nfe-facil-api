import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  @Type(() => Array)
  items: T[];

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  pageSize: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;

  constructor(data: Partial<PaginatedResponseDto<T>>) {
    Object.assign(this, data);
  }
}

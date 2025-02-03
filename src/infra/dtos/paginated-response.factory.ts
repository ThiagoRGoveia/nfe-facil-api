import { ApiProperty } from '@nestjs/swagger';

type ClassConstructor<T> = new (...args: any[]) => T;

export function PaginatedRestResponse<T>(classConstructor: ClassConstructor<T>) {
  class PaginatedResponseDto {
    @ApiProperty({
      type: [classConstructor],
      description: 'Array of items',
    })
    items: T[];

    @ApiProperty({
      example: 100,
      description: 'Total number of items',
    })
    total: number;

    @ApiProperty({
      example: 1,
      description: 'Current page number',
    })
    page: number;

    @ApiProperty({
      example: 10,
      description: 'Number of items per page',
    })
    pageSize: number;

    @ApiProperty({
      example: 10,
      description: 'Total number of pages',
    })
    totalPages: number;
  }

  return PaginatedResponseDto;
}

import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Sort, SortDirection } from './sort.dto';
import { Pagination } from './pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RestQueryDto {
  @ApiProperty({
    required: false,
    default: SortDirection.ASC,
    enum: SortDirection,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn([SortDirection.ASC, SortDirection.DESC])
  @IsOptional()
  sortDirection: SortDirection = SortDirection.ASC;

  @ApiProperty({
    required: false,
    default: 'id',
    description: 'The field to sort by',
  })
  @IsOptional()
  sortField: string = 'id';

  @ApiProperty({
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  pageSize: number = 10;

  toPagination(): Pagination {
    return {
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  toSort(): Sort {
    return {
      field: this.sortField,
      direction: this.sortDirection,
    };
  }
}

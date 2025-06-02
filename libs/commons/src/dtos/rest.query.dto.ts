import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Sort, SortDirection } from './sort.dto';
import { Pagination } from './pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => parseInt(value, 10))
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
  @Transform(({ value }) => parseInt(value, 10))
  pageSize: number = 10;

  toPagination(): Pagination | undefined {
    if (!this.page || !this.pageSize) {
      return undefined;
    }
    return {
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  toSort(): Sort | undefined {
    if (!this.sortField || !this.sortDirection) {
      return undefined;
    }
    return {
      field: this.sortField,
      direction: this.sortDirection,
    };
  }
}

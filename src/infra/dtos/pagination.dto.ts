import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class Pagination {
  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  currentPage: number;
}

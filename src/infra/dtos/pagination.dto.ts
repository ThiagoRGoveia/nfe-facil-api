import { InputType } from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

@InputType()
export class Pagination {
  @Field(() => Number)
  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize: number;

  @Field(() => Number)
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  currentPage: number;
}

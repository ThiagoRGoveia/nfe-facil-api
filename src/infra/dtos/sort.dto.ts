import { InputType } from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

@InputType()
export class Sort {
  @Field(() => String)
  @ApiProperty({
    description: 'Field to sort by, for nested fields use dot notation',
  })
  @Allow()
  field: string;

  @Field(() => String)
  @ApiProperty({
    enum: SortDirection,
    description: 'The direction of the sort values: (ASC or DESC)',
  })
  @Allow()
  direction: SortDirection;
}

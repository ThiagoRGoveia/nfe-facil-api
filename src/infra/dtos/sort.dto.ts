import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class Sort {
  @ApiProperty({
    description: 'Field to sort by, for nested fields use dot notation',
  })
  @Allow()
  field: string;

  @ApiProperty({
    enum: SortDirection,
    description: 'The direction of the sort values: (ASC or DESC)',
  })
  @Allow()
  direction: SortDirection;
}

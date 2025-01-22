import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class Filter {
  @ApiProperty({
    description: 'Field to filter by, for nested fields use dot notation, e.g: shipment.carrier.name',
  })
  @Allow()
  field?: string;

  @ApiProperty({
    required: false,
    description: 'Value to filter by. Should not be used with range or in.',
  })
  @Allow()
  value?: string;

  @ApiProperty({
    required: false,
    description: 'Value to filter by. Should not be used with range or in.',
  })
  @Allow()
  ilike?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Range of values to filter by. Should not be used with value or in.',
  })
  @Allow()
  range?: [string, string];

  @ApiProperty({
    required: false,
    description: 'Value to filter by. Should not be used with range or in.',
  })
  @Allow()
  greaterThan?: string;

  @ApiProperty({
    required: false,
    description: 'Value to filter by. Should not be used with range or in.',
  })
  @Allow()
  lessThan?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Array of values to filter by. Should not be used with value or range. ',
  })
  @Allow()
  in?: Array<string>;

  /**
   * Indicates whether to negate the filter.
   * for example if the filter is { field: 'name', value: 'John', not: true } it will filter all records where name is not John.
   * Default value is false.
   */
  @ApiProperty({
    required: false,
    default: false,
    description: 'Indicates whether to negate the filter.',
  })
  @Allow()
  not?: boolean;
}

export class Filters {
  @ApiProperty({
    type: [Filter],
    required: false,
  })
  @Allow()
  filters?: Filter[];
}

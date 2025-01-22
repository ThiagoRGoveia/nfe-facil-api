import { BaseEntity as MikroORMBaseEntity, OptionalProps, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

export class BaseEntity<T = never> extends MikroORMBaseEntity {
  [OptionalProps]?: T | 'createdAt' | 'updatedAt';

  @ApiProperty({
    description: 'Creation date',
  })
  @Property({ columnType: 'timestamp', defaultRaw: 'now()' })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
  })
  @Property({
    columnType: 'timestamp',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt: Date;
}

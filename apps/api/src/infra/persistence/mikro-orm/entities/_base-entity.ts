import { BaseEntity as MikroORMBaseEntity, OptionalProps, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class BaseEntity<T = never> extends MikroORMBaseEntity {
  [OptionalProps]?: T | 'createdAt' | 'updatedAt';

  @ApiProperty({
    description: 'Creation date',
  })
  @Property({ columnType: 'timestamp', defaultRaw: 'now()' })
  @Field(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
  })
  @Property({
    columnType: 'timestamp',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  @Field(() => Date)
  updatedAt: Date;
}

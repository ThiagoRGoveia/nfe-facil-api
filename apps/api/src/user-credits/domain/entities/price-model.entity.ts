import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
@Entity({ tableName: 'price_models' })
export class PriceModel extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'Price model unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => String)
  @ApiProperty({
    description: 'Name of the price model',
  })
  @Property()
  name!: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Description of the price model',
  })
  @Property()
  description!: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Process code this price applies to',
  })
  @Property()
  processCode!: string;

  @Field(() => Number)
  @ApiProperty({
    description: 'Cost in credits per unit (e.g., per file)',
  })
  @Property()
  costPerUnit!: number;

  @Field(() => Boolean)
  @ApiProperty({
    description: 'Whether this is the default price model for the process',
  })
  @Property()
  isDefault: boolean = false;

  @Field(() => Boolean)
  @ApiProperty({
    description: 'Whether this price model is active',
  })
  @Property()
  isActive: boolean = true;

  @Field(() => String)
  @ApiProperty({
    description: 'Currency of the price model',
  })
  @Property()
  currency!: string;

  // Domain logic methods
  public calculateCost(units: number): number {
    return units * this.costPerUnit;
  }

  public activate(): void {
    this.isActive = true;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public makeDefault(): void {
    this.isDefault = true;
  }
}

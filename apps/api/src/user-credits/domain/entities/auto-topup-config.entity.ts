import { Entity, PrimaryKey, Property, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@/core/users/domain/entities/user.entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
@Entity({ tableName: 'auto_topup_configs' })
export class AutoTopupConfig extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'Auto top-up config unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => User)
  @ApiProperty({
    description: 'User who owns this auto top-up configuration',
  })
  @ManyToOne(() => User, { ref: true, eager: false })
  user!: Ref<User>;

  @Field(() => Number)
  @ApiProperty({
    description: 'Threshold below which auto top-up is triggered',
  })
  @Property()
  threshold!: number;

  @Field(() => Number)
  @ApiProperty({
    description: 'Amount of credits to add when auto top-up is triggered',
  })
  @Property()
  amount!: number;

  @Field(() => Boolean)
  @ApiProperty({
    description: 'Whether auto top-up is enabled',
  })
  @Property()
  enabled: boolean = true;

  @Field(() => Date, { nullable: true })
  @ApiProperty({
    description: 'Last time auto top-up was triggered',
    required: false,
  })
  @Property({ nullable: true })
  lastTriggeredAt?: Date;

  // Domain logic methods
  public shouldTriggerTopup(currentBalance: number): boolean {
    return this.enabled && currentBalance < this.threshold;
  }

  public disable(): void {
    this.enabled = false;
  }

  public enable(): void {
    this.enabled = true;
  }

  public updateLastTriggered(): void {
    this.lastTriggeredAt = new Date();
  }
}

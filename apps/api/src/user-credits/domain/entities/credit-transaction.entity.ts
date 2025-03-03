import { Entity, PrimaryKey, Property, ManyToOne, Ref, Enum } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '@/core/users/domain/entities/user.entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  PURCHASE = 'purchase',
  TOPUP = 'top-up',
  SUBSCRIPTION = 'subscription',
  REFUND = 'refund',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'Type of credit transaction',
});

export enum TransactionStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  PENDING = 'pending',
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
  description: 'Status of the transaction',
});

@ObjectType()
@Entity({ tableName: 'credit_transactions' })
export class CreditTransaction extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'Transaction unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => User)
  @ApiProperty({
    description: 'User associated with this transaction',
  })
  @ManyToOne(() => User, { ref: true, eager: false })
  user!: Ref<User>;

  @Field(() => TransactionType)
  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
  })
  @Enum(() => TransactionType)
  type!: TransactionType;

  @Field(() => Number)
  @ApiProperty({
    description: 'Amount of credits involved in transaction',
  })
  @Property()
  amount!: number;

  @Field(() => Number)
  @ApiProperty({
    description: 'Balance before transaction',
  })
  @Property()
  balanceBefore!: number;

  @Field(() => Number)
  @ApiProperty({
    description: 'Balance after transaction',
  })
  @Property()
  balanceAfter!: number;

  @Field(() => TransactionStatus)
  @ApiProperty({
    description: 'Status of the transaction',
    enum: TransactionStatus,
  })
  @Enum(() => TransactionStatus)
  status!: TransactionStatus;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'External operation ID (Stripe, operation ID, etc.)',
    required: false,
  })
  @Property({ nullable: true })
  externalOperationId?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'Subscription ID for subscription-related transactions',
    required: false,
  })
  @Property({ nullable: true })
  subscriptionId?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'Metadata about the transaction in JSON format',
    required: false,
  })
  @Property({ nullable: true, type: 'json' })
  metadata?: Record<string, unknown>;
}

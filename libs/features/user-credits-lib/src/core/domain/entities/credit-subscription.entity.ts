import { Entity, PrimaryKey, Property, ManyToOne, Ref, Enum } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '@/core/users/domain/entities/user.entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  FAILED = 'failed',
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
  description: 'Status of the credit subscription',
});

export enum SubscriptionInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

registerEnumType(SubscriptionInterval, {
  name: 'SubscriptionInterval',
  description: 'Interval of credit subscription renewal',
});

@ObjectType()
@Entity({ tableName: 'credit_subscriptions' })
export class CreditSubscription extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'Subscription unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => User)
  @ApiProperty({
    description: 'User who owns this subscription',
  })
  @ManyToOne(() => User, { ref: true, eager: false })
  user!: Ref<User>;

  @Field(() => Number)
  @ApiProperty({
    description: 'Amount of credits to add on each renewal',
  })
  @Property()
  creditAmount!: number;

  @Field(() => SubscriptionInterval)
  @ApiProperty({
    description: 'Interval of subscription renewal',
    enum: SubscriptionInterval,
  })
  @Enum(() => SubscriptionInterval)
  interval!: SubscriptionInterval;

  @Field(() => SubscriptionStatus)
  @ApiProperty({
    description: 'Current status of the subscription',
    enum: SubscriptionStatus,
  })
  @Enum(() => SubscriptionStatus)
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'External subscription ID (e.g., from Stripe)',
    required: false,
  })
  @Property({ nullable: true })
  externalSubscriptionId?: string;

  @Field(() => Date)
  @ApiProperty({
    description: 'Date of next scheduled renewal',
  })
  @Property()
  nextRenewalDate!: Date;

  @Field(() => Date, { nullable: true })
  @ApiProperty({
    description: 'Date when subscription was cancelled',
    required: false,
  })
  @Property({ nullable: true })
  cancelledAt?: Date;

  // Domain logic methods
  public cancel(): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = new Date();
  }

  public isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  public shouldProcessTopup(currentDate: Date): boolean {
    return this.isActive() && this.nextRenewalDate <= currentDate;
  }

  public updateNextRenewalDate(): void {
    const currentDate = new Date(this.nextRenewalDate);

    switch (this.interval) {
      case SubscriptionInterval.MONTHLY:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case SubscriptionInterval.QUARTERLY:
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case SubscriptionInterval.YEARLY:
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }

    this.nextRenewalDate = currentDate;
  }
}

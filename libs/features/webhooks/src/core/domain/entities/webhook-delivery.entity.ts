import { Entity, Enum, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { Webhook } from './webhook.entity';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { DatePort } from 'libs/tooling/date/src/core/date.adapter';

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY_PENDING = 'RETRY_PENDING',
  RETRYING = 'RETRYING',
}

@ObjectType()
@Entity({ tableName: 'webhook_deliveries' })
export class WebhookDelivery extends BaseEntity {
  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => Webhook)
  @ManyToOne(() => Webhook, { ref: true, eager: false, deleteRule: 'set null', nullable: true })
  webhook!: Ref<Webhook>;

  @Field(() => String)
  @Property({ type: 'json' })
  payload!: unknown;

  @Field(() => WebhookDeliveryStatus)
  @Enum(() => WebhookDeliveryStatus)
  status: WebhookDeliveryStatus = WebhookDeliveryStatus.PENDING;

  @Field(() => Number)
  @Property({ default: 0 })
  retryCount: number = 0;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  lastError?: string;

  @Field(() => Date, { nullable: true })
  @Property({ nullable: true })
  lastAttempt?: Date;

  @Field(() => Date, { nullable: true })
  @Property({ nullable: true })
  nextAttempt?: Date;

  setNextAttempt(): void {
    if (!this.lastAttempt) return;

    // Exponential backoff with base delay of 1 second
    // Formula: delay = 1000 * (2 ^ retryCount)
    const delay = 1000 * Math.pow(2, this.retryCount);

    // Add some jitter to prevent thundering herd
    const jitter = Math.random() * 1000;

    this.nextAttempt = new Date(this.lastAttempt.getTime() + delay + jitter);
  }

  canRetry(maxRetries: number): boolean {
    return this.status !== WebhookDeliveryStatus.FAILED && this.retryCount < maxRetries;
  }

  markAsSuccess(): void {
    this.status = WebhookDeliveryStatus.SUCCESS;
    this.lastAttempt = DatePort.now();
  }

  markAsFailed(error: string): void {
    this.status = WebhookDeliveryStatus.FAILED;
    this.lastError = error;
    this.lastAttempt = DatePort.now();
  }

  markAsRetryPending(error: string): void {
    this.status = WebhookDeliveryStatus.RETRY_PENDING;
    this.lastError = error;
    this.lastAttempt = DatePort.now();
  }

  startRetry(): void {
    this.status = WebhookDeliveryStatus.RETRYING;
    this.retryCount++;
  }
}

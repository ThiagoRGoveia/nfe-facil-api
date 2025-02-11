import { User } from '@/core/users/domain/entities/user.entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum WebhookEvent {
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  DOCUMENT_FAILED = 'DOCUMENT_FAILED',
  BATCH_FINISHED = 'BATCH_FINISHED',
}

export enum WebhookAuthType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  OAUTH2 = 'OAUTH2',
}

registerEnumType(WebhookEvent, { name: 'WebhookEvent' });
registerEnumType(WebhookAuthType, { name: 'WebhookAuthType' });
registerEnumType(WebhookStatus, { name: 'WebhookStatus' });

@ObjectType()
@Entity({ tableName: 'webhooks' })
export class Webhook extends BaseEntity<'maxRetries' | 'timeout' | 'headers'> {
  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => String)
  @Property()
  name!: string;

  @Field(() => String)
  @Property()
  url!: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  secret?: string;

  @Field(() => [WebhookEvent])
  @Property({ type: 'array' })
  events!: WebhookEvent[];

  @Index()
  @Field(() => WebhookStatus)
  @Enum(() => WebhookStatus)
  status: WebhookStatus = WebhookStatus.ACTIVE;

  @Field(() => Number)
  @Property({ default: 3 })
  maxRetries: number = 3;

  @Field(() => Number)
  @Property({ default: 5000 })
  timeout: number = 5000;

  @Field(() => User)
  @ManyToOne(() => User, { ref: true, eager: false })
  user!: Ref<User>;

  @Field(() => WebhookAuthType)
  @Enum(() => WebhookAuthType)
  authType: WebhookAuthType = WebhookAuthType.NONE;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  encryptedConfig?: string;

  @Field(() => String)
  @Property({ type: 'json' })
  headers: Record<string, string> = {};

  @Field(() => Date)
  @Property()
  createdAt: Date = new Date();

  isActive(): boolean {
    return this.status === WebhookStatus.ACTIVE;
  }

  deactivate(): void {
    this.status = WebhookStatus.INACTIVE;
  }

  activate(): void {
    this.status = WebhookStatus.ACTIVE;
  }

  subscribesToEvent(event: WebhookEvent): boolean {
    return this.events.includes(event);
  }
}

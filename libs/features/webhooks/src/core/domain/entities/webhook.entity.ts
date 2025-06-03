import { User } from '@lib/users/core/domain/entities/user.entity';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { BaseEntity } from '@lib/database/infra/persistence/mikro-orm/entities/_base-entity';
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
export class BasicAuthConfig {
  @Field(() => String)
  username: string;

  @Field(() => String)
  password: string;
}

@ObjectType()
export class OAuth2Config {
  @Field(() => String)
  clientId: string;

  @Field(() => String)
  clientSecret: string;

  @Field(() => String)
  tokenUrl: string;
}

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
  @ManyToOne(() => User, { ref: true, eager: false, hidden: true })
  user!: Ref<User>;

  @Field(() => WebhookAuthType)
  @Enum(() => WebhookAuthType)
  authType: WebhookAuthType = WebhookAuthType.NONE;

  @Property({ nullable: true })
  encryptedConfig?: string;

  @Field(() => String)
  @Property({ type: 'json' })
  headers: Record<string, string> = {};

  @Property({ columnType: 'timestamp', defaultRaw: 'now()' })
  @Field(() => Date)
  createdAt: Date;

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

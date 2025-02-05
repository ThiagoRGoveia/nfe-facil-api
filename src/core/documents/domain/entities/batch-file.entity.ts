import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field } from '@nestjs/graphql';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { BatchProcess } from './batch-process.entity';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Ref } from '@mikro-orm/core/entity';

export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@ObjectType()
@Entity({ tableName: 'batch_files' })
export class BatchFile extends BaseEntity {
  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => String)
  @Property()
  filename!: string;

  @Field(() => FileStatus)
  @Enum(() => FileStatus)
  status: FileStatus = FileStatus.PENDING;

  @Field(() => String)
  @Property()
  storagePath!: string;

  @Index()
  @Field(() => BatchProcess)
  @ManyToOne(() => BatchProcess, { eager: false, ref: true })
  batchProcess!: Ref<BatchProcess>;

  // Status transition methods
  markProcessing() {
    this.status = FileStatus.PROCESSING;
  }

  markCompleted() {
    this.status = FileStatus.COMPLETED;
  }

  markFailed() {
    this.status = FileStatus.FAILED;
  }
}

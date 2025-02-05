import { Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Ref } from '@mikro-orm/core';
import { ObjectType, Field } from '@nestjs/graphql';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { User } from '@/core/users/domain/entities/user.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { Collection } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { BatchFile } from './batch-file.entity';
import { BadRequestException } from '@nestjs/common';
export enum BatchStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@ObjectType()
@Entity({ tableName: 'batch_processes' })
export class BatchProcess extends BaseEntity<'totalFiles' | 'processedFiles'> {
  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => BatchStatus)
  @Enum(() => BatchStatus)
  status: BatchStatus = BatchStatus.CREATED;

  @Field(() => Template)
  @ManyToOne(() => Template, { eager: false, ref: true })
  template!: Ref<Template>;

  @Field(() => [BatchFile])
  @OneToMany(() => BatchFile, (file) => file.batchProcess, { eager: false, ref: true })
  files = new Collection<BatchFile>(this);

  @Field(() => User)
  @ManyToOne(() => User, { eager: false, ref: true })
  user!: Ref<User>;

  @Field(() => Number)
  totalFiles: number = 0;

  @Field(() => Number)
  processedFiles: number = 0;

  // Domain logic methods
  addFile(file: BatchFile) {
    if (this.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Cannot add files to a started batch');
    }
    this.files.add(file);
  }

  cancel() {
    if (this.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Cannot cancel a batch that has already started');
    }
    this.status = BatchStatus.CANCELLED;
  }
}

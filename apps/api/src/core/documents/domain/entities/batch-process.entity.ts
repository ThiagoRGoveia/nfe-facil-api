import { Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { User } from '@/core/users/domain/entities/user.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { Collection } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { BadRequestException } from '@nestjs/common';
import { FileRecord } from './file-records.entity';
import { OutputFormat } from '../types/output-format.type';
import { FileFormat } from '../constants/file-formats';

export enum BatchStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

registerEnumType(BatchStatus, {
  name: 'BatchStatus',
  description: 'The status of a batch process',
});

@ObjectType()
@Entity({ tableName: 'batch_processes' })
export class BatchProcess extends BaseEntity<'totalFiles' | 'processedFiles' | 'requestedFormats'> {
  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => BatchStatus)
  @Enum(() => BatchStatus)
  status: BatchStatus;

  @Field(() => Template)
  @ManyToOne(() => Template, { eager: false, ref: true })
  template!: Ref<Template>;

  @OneToMany(() => FileRecord, (process) => process.batchProcess, { eager: false, ref: true })
  files = new Collection<FileRecord>(this);

  @Field(() => User)
  @ManyToOne(() => User, { eager: false, ref: true })
  user!: Ref<User>;

  @Field(() => Number)
  @Property()
  totalFiles: number = 0;

  @Field(() => Number)
  @Property()
  processedFiles: number = 0;

  @Field(() => [String])
  @Property({ type: 'array', default: [FileFormat.JSON] })
  requestedFormats: OutputFormat[] = [FileFormat.JSON];

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  jsonResults?: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  csvResults?: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  excelResults?: string;

  // Domain logic methods
  addFile(process: FileRecord) {
    if (this.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Cannot add files to a started batch');
    }
    this.files.add(process);
  }

  cancel() {
    if (this.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Cannot cancel a batch that has already started');
    }
    this.status = BatchStatus.CANCELLED;
  }

  markCompleted() {
    this.status = BatchStatus.COMPLETED;
  }
}

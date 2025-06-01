import { Entity, Enum, Index, ManyToOne, OptionalProps, PrimaryKey, Property, Ref, types } from '@mikro-orm/core';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { BatchProcess } from './batch-process.entity';
import { ObjectType, registerEnumType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { User } from '@/core/users/domain/entities/user.entity';
import { DatePort } from '@/infra/adapters/date.adapter';
export enum FileProcessStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(FileProcessStatus, {
  name: 'FileProcessStatus',
  description: 'The status of a file process',
});

@ObjectType()
@Index({ properties: ['createdAt', 'batchProcess'] })
@Entity({ tableName: 'file_records' })
export class FileRecord {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => Template)
  @Index()
  @ManyToOne(() => Template, { ref: true, eager: false, hidden: true })
  template: Ref<Template>;

  @Field(() => String)
  @Property()
  fileName: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  filePath?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Property({ nullable: true, type: types.json })
  result?: unknown;

  @Field(() => FileProcessStatus)
  @Enum(() => FileProcessStatus)
  status: FileProcessStatus;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  error?: string;

  @Field(() => Date, { nullable: true })
  @Property({ nullable: true })
  notifiedAt?: Date;

  @Field(() => BatchProcess)
  @ManyToOne(() => BatchProcess, { ref: true, eager: false, nullable: true, hidden: true })
  batchProcess?: Ref<BatchProcess>;

  @Field(() => User)
  @Index()
  @ManyToOne(() => User, { ref: true, eager: false, hidden: true })
  user: Ref<User>;

  @Field(() => Date)
  @Property({ columnType: 'timestamp', defaultRaw: 'now()' })
  createdAt: Date;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'now()',
    onUpdate: () => DatePort.now(),
  })
  updatedAt: Date;

  public setFilePath(filePath: string): void {
    this.filePath = filePath;
  }

  public setResult(result: unknown): void {
    this.result = result;
  }

  public markProcessing(): void {
    this.status = FileProcessStatus.PROCESSING;
  }

  public markCompleted(): void {
    this.status = FileProcessStatus.COMPLETED;
  }

  public markFailed(error: string): void {
    this.status = FileProcessStatus.FAILED;
    this.error = error;
  }

  public markNotified(): void {
    this.notifiedAt = DatePort.now();
  }
}

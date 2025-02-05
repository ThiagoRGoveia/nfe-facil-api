import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Entity, Index, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { BatchProcess } from './batch-process.entity';

export enum FileProcessStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ tableName: 'document_processes' })
export class FileToProcess extends BaseEntity {
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Index()
  @ManyToOne(() => Template, { ref: true, eager: false })
  template: Ref<Template>;

  @Property()
  fileName: string;

  @Property({ nullable: true })
  filePath?: string;

  @Property({ nullable: true })
  payload?: unknown;

  @Property()
  status: FileProcessStatus;

  @Property({ nullable: true })
  error?: string;

  @Index()
  @ManyToOne(() => BatchProcess, { ref: true, eager: false, nullable: true })
  batchProcess?: Ref<BatchProcess>;

  public setFilePath(filePath: string): void {
    this.filePath = filePath;
  }

  public setPayload(payload: unknown): void {
    this.payload = payload;
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
}

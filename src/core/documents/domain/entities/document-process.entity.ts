import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Entity, Index, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { Template } from '@/core/templates/domain/entities/template.entity';

export enum DocumentProcessStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ tableName: 'document_processes' })
export class DocumentProcess extends BaseEntity {
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
  status: DocumentProcessStatus;

  @Property({ nullable: true })
  error?: string;

  public setFilePath(filePath: string): void {
    this.filePath = filePath;
  }

  public setPayload(payload: unknown): void {
    this.payload = payload;
  }

  public markCompleted(): void {
    this.status = DocumentProcessStatus.COMPLETED;
  }

  public markFailed(error: string): void {
    this.status = DocumentProcessStatus.FAILED;
    this.error = error;
  }
}

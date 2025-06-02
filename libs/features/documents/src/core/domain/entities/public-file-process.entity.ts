import { Entity, Enum, Index, ManyToOne, OptionalProps, PrimaryKey, Property, Ref, types } from '@mikro-orm/core';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { ObjectType, registerEnumType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { DatePort } from 'libs/tooling/date/src/core/date.adapter';

export enum PublicFileProcessStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(PublicFileProcessStatus, {
  name: 'PublicFileProcessStatus',
  description: 'The status of a public file process',
});

@ObjectType()
@Entity({ tableName: 'public_file_processes' })
export class PublicFileProcess {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'status';

  @Field(() => String)
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => Template)
  @Index()
  @ManyToOne(() => Template, { ref: true, eager: false })
  template: Ref<Template>;

  @Field(() => String)
  @Property()
  fileName: string;

  @Field(() => String)
  @Property()
  filePath: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Property({ nullable: true, type: types.json })
  result?: unknown;

  @Field(() => PublicFileProcessStatus)
  @Enum(() => PublicFileProcessStatus)
  status: PublicFileProcessStatus;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  error?: string;

  @Property({ columnType: 'timestamp', defaultRaw: 'now()' })
  createdAt: Date;

  @Property({
    columnType: 'timestamp',
    defaultRaw: 'now()',
    onUpdate: () => DatePort.now(),
  })
  updatedAt: Date;

  public setResult(result: unknown): void {
    this.result = result;
  }

  public markCompleted(): void {
    this.status = PublicFileProcessStatus.COMPLETED;
  }

  public markFailed(error: string): void {
    this.status = PublicFileProcessStatus.FAILED;
    this.error = error;
  }
}

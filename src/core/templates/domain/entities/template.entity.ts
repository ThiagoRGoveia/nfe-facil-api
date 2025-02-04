import { Entity, PrimaryKey, Property, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/core/users/domain/entities/user.entity';
import { GraphQLJSON } from 'graphql-scalars';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';

@ObjectType()
@Entity({ tableName: 'template' })
export class Template extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'Template unique identifier',
    example: 1,
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => String)
  @ApiProperty({
    description: 'Template name',
    example: 'Invoice Template',
  })
  @Property()
  name: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Process code that identifies the workflow to be used',
    example: 'invoice-processing',
  })
  @Property()
  processCode: string;

  @Field(() => GraphQLJSON)
  @ApiProperty({
    description: 'Metadata configuration for the template processing',
    example: { fields: ['invoice_number', 'total_amount'] },
  })
  @Property({ type: 'json' })
  metadata: Record<string, unknown>;

  @Field(() => String)
  @ApiProperty({
    description: 'Output format for the processed data',
    enum: ['JSON', 'XML', 'CSV'],
    example: 'JSON',
  })
  @Property()
  outputFormat: string;

  @Field(() => Boolean)
  @ApiProperty({
    description: 'Whether the template is public or private',
    example: false,
  })
  @Property()
  isPublic: boolean;

  @Field(() => User)
  @ApiProperty({
    type: () => User,
    description: 'Template owner',
  })
  @ManyToOne(() => User, { ref: true, eager: false, nullable: true })
  user?: Ref<User>;

  public isAccessibleByUser(user: User): boolean {
    return this.isPublic || this.user?.id === user.id;
  }
}

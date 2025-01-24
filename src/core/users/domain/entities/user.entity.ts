import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
@Entity({ tableName: 'user' })
export class User extends BaseEntity {
  @Field(() => Number)
  @ApiProperty({
    description: 'User unique identifier',
  })
  @PrimaryKey()
  id: number;

  @Field(() => String)
  @ApiProperty({
    description: 'User first name',
  })
  @Property()
  name: string;

  @Field(() => String)
  @ApiProperty({
    description: 'User last name',
  })
  @Property()
  surname: string;

  @Field(() => String)
  @ApiProperty({
    description: 'User email',
  })
  @Property()
  email: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Client unique identifier',
  })
  @Property()
  clientId: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Client secret',
  })
  @Property()
  clientSecret: string;

  @Field(() => Number)
  @ApiProperty({
    description: 'User available credits',
  })
  @Property()
  credits: number;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'External payment system identifier',
    required: false,
  })
  @Property({ nullable: true })
  paymentExternalId?: string;

  @Field(() => UserRole)
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
  })
  @Enum(() => UserRole)
  role: UserRole;
}

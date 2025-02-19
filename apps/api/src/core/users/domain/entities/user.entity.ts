import { Entity, PrimaryKey, Property, Enum, Unique, Index } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
@Entity({ tableName: 'user' })
export class User extends BaseEntity<'isSocial'> {
  @Field(() => String)
  @ApiProperty({
    description: 'User unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'User first name',
    required: false,
  })
  @Property({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'User last name',
    required: false,
  })
  @Property({ nullable: true })
  surname?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'User email',
    required: false,
  })
  @Property({ nullable: true })
  email?: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Client unique identifier',
  })
  @Property()
  @Index()
  @Unique()
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

  @Field(() => String)
  @ApiProperty({
    description: 'Auth0 user identifier',
  })
  @Unique()
  @Property()
  auth0Id: string;

  @Field(() => UserRole)
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
  })
  @Enum(() => UserRole)
  role: UserRole;

  @Property({ default: false })
  @Field(() => Boolean)
  @ApiProperty({
    description: 'Whether the user was created through social login',
    default: false,
  })
  isSocial: boolean = false;
}

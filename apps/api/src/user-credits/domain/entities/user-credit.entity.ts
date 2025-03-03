import { Entity, PrimaryKey, Property, ManyToOne, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@/core/users/domain/entities/user.entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
@Entity({ tableName: 'user_credit' })
export class UserCredit extends BaseEntity {
  @Field(() => String)
  @ApiProperty({
    description: 'User credit unique identifier',
  })
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Field(() => User)
  @ApiProperty({
    description: 'User that owns these credits',
  })
  @ManyToOne(() => User, { ref: true, eager: false })
  user!: Ref<User>;

  @Field(() => Number)
  @ApiProperty({
    description: 'Current credit balance',
  })
  @Property()
  balance: number = 0;

  // Domain logic methods
  public deductCredits(amount: number): boolean {
    if (this.balance < amount) {
      return false;
    }
    this.balance -= amount;
    return true;
  }

  public addCredits(amount: number): void {
    this.balance += amount;
  }
}

import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/entities/user.entity';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateUserDto {
  @Field(() => String)
  @ApiProperty({
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @ApiProperty({
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @Field(() => String)
  @ApiProperty({
    description: 'User email',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @Field(() => Number)
  @ApiProperty({
    description: 'User available credits',
  })
  @IsNumber()
  @IsOptional()
  credits: number = 0;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'External payment system identifier',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentExternalId?: string;

  @Field(() => UserRole)
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole = UserRole.CUSTOMER;
}

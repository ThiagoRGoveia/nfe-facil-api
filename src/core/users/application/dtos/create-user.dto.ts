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

  @Field(() => Number)
  @ApiProperty({
    description: 'Client unique identifier',
  })
  @IsNumber()
  @IsNotEmpty()
  clientId: number;

  @Field(() => Number)
  @ApiProperty({
    description: 'User available credits',
  })
  @IsNumber()
  @IsNotEmpty()
  credits: number;

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
  @IsNotEmpty()
  role: UserRole;
}

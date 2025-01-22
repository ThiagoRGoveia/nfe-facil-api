import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/entities/user.entity';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateUserDto {
  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'User first name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'User last name',
    required: false,
  })
  @IsString()
  @IsOptional()
  surname?: string;

  @Field(() => Number, { nullable: true })
  @ApiProperty({
    description: 'Client unique identifier',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @Field(() => Number, { nullable: true })
  @ApiProperty({
    description: 'User available credits',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  credits?: number;

  @Field(() => String, { nullable: true })
  @ApiProperty({
    description: 'External payment system identifier',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentExternalId?: string;

  @Field(() => UserRole, { nullable: true })
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

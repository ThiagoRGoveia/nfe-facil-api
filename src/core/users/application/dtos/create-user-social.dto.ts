import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateUserSocialDto {
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
    description: 'User email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String)
  @ApiProperty({
    description: 'Auth0 user identifier',
  })
  @IsString()
  auth0Id: string;
}

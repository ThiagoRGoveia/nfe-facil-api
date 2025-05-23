import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactFormDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

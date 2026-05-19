import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PublicLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

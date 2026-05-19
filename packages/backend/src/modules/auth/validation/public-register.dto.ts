import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

// min 8 chars, at least 1 letter and 1 number
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
const PASSWORD_MSG = { message: 'A senha deve ter no mínimo 8 caracteres, uma letra e um número' };

export class PublicRegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @Matches(PASSWORD_REGEX, PASSWORD_MSG)
  password: string;

  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

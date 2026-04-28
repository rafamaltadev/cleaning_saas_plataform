import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['tenant_admin', 'supervisor', 'staff'], { each: true })
  roles: string[];
}

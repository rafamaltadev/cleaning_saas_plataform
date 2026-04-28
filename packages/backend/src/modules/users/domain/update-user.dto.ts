import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['tenant_admin', 'supervisor', 'staff'], { each: true })
  roles?: string[];
}

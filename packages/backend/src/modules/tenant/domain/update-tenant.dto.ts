import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['BRL', 'USD'])
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

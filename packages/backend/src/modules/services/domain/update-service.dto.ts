import {
  IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  base_rate_cents?: number;

  @IsOptional()
  @IsIn(['sqm', 'hour', 'flat'])
  unit?: 'sqm' | 'hour' | 'flat';

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_duration_minutes?: number;

  @IsOptional()
  @IsIn(['fixed', 'hourly'])
  billing_type?: 'fixed' | 'hourly';

  @IsOptional()
  @IsObject()
  availability?: object;

  @IsOptional()
  @IsBoolean()
  materials_included?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  materials_cost_cents?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsBoolean()
  has_addons?: boolean;
}

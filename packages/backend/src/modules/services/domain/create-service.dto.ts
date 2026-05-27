import {
  IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Matches, Min,
} from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  base_rate_cents: number;

  @IsIn(['sqm', 'hour', 'flat'])
  unit: 'sqm' | 'hour' | 'flat';

  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
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

import { IsIn, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePricingRuleDto {
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_area?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_area?: number;

  @IsOptional()
  @IsIn(['one_time', 'weekly', 'monthly'])
  frequency?: 'one_time' | 'weekly' | 'monthly';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discount_percent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_multiplier?: number;
}

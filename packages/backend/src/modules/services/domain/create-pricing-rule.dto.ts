import { IsIn, IsInt, IsNumber, IsOptional, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreatePricingRuleDto {
  @Matches(UUID_REGEX, UUID_MSG)
  service_id: string;

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

  @IsIn(['one_time', 'weekly', 'monthly'])
  frequency: 'one_time' | 'weekly' | 'monthly';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  discount_percent: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_multiplier: number;
}

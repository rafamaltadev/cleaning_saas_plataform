import { IsArray, IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class QuoteEstimateDto {
  @Matches(UUID_REGEX, UUID_MSG)
  service_id: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  area_sqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Type(() => Number)
  duration_hours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  manual_discount_percent?: number;

  @IsOptional()
  @IsArray()
  @Matches(UUID_REGEX, { ...UUID_MSG, each: true })
  addon_ids?: string[];
}

import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreateQuoteDto {
  @Matches(UUID_REGEX, UUID_MSG)
  client_id: string;

  @Matches(UUID_REGEX, UUID_MSG)
  service_id: string;

  @Matches(UUID_REGEX, UUID_MSG)
  @IsOptional()
  pricing_rule_id?: string;

  @IsString()
  currency: string;

  @IsDateString()
  valid_until: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  manual_discount_percent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  area_sqm?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  duration_hours?: number;

  @IsOptional()
  @IsString()
  service_address?: string;

  @IsOptional()
  @IsBoolean()
  use_client_address?: boolean;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsDateString()
  service_date?: string;
}

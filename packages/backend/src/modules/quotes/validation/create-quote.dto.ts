import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateQuoteDto {
  @IsUUID('all')
  client_id: string;

  @IsUUID('all')
  service_id: string;

  @IsUUID('all')
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

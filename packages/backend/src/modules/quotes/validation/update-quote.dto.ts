import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateQuoteDto {
  @IsUUID()
  @IsOptional()
  client_id?: string;

  @IsUUID()
  @IsOptional()
  service_id?: string;

  @IsUUID()
  @IsOptional()
  pricing_rule_id?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  valid_until?: string;

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

  @IsIn(['rejected', 'accepted'])
  @IsOptional()
  status?: 'rejected' | 'accepted';
}

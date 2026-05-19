import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreatePublicQuoteDto {
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
  @IsArray()
  @Matches(UUID_REGEX, { ...UUID_MSG, each: true })
  addon_ids?: string[];

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimated_total_cents?: number;
}

import { IsBoolean, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreateBookingDto {
  @Matches(UUID_REGEX, UUID_MSG)
  quote_id: string;

  @Matches(UUID_REGEX, UUID_MSG)
  @IsOptional()
  client_id?: string;

  @Matches(UUID_REGEX, UUID_MSG)
  @IsOptional()
  service_id?: string;

  @IsDateString()
  scheduled_start: string;

  @IsDateString()
  scheduled_end: string;

  @IsString()
  @IsOptional()
  assigned_team?: string;

  @IsString()
  idempotency_key: string;

  @IsOptional()
  @IsString()
  service_address?: string;

  @IsOptional()
  @IsBoolean()
  use_client_address?: boolean;

  @IsOptional()
  @IsString()
  observations?: string;
}

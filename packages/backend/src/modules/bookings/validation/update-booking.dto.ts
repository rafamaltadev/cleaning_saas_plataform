import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, Matches } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class UpdateBookingDto {
  @Matches(UUID_REGEX, UUID_MSG)
  @IsOptional()
  quote_id?: string;

  @IsDateString()
  @IsOptional()
  scheduled_start?: string;

  @IsDateString()
  @IsOptional()
  scheduled_end?: string;

  @IsString()
  @IsOptional()
  assigned_team?: string;

  @IsIn(['rescheduled', 'cancelled', 'confirmed'])
  @IsOptional()
  status?: 'rescheduled' | 'cancelled' | 'confirmed';

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

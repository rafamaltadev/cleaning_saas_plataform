import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateBookingDto {
  @IsUUID('all')
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
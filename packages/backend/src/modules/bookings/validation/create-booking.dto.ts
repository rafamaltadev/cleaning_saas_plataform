import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID('all')
  quote_id: string;

  @IsUUID('all')
  @IsOptional()
  client_id?: string;

  @IsUUID('all')
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
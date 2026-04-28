import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  quote_id: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  service_id: string;

  @IsDateString()
  scheduled_start: string;

  @IsDateString()
  scheduled_end: string;

  @IsString()
  @IsOptional()
  assigned_team?: string;

  @IsString()
  idempotency_key: string;
}
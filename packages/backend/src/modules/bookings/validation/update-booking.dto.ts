import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateBookingDto {
  @IsUUID()
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

  @IsIn(['rescheduled', 'cancelled'])
  @IsOptional()
  status?: 'rescheduled' | 'cancelled';
}
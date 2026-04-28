import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
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
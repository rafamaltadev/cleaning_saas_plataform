import { IsString, IsUUID, Matches } from 'class-validator';

export class CreateAvailabilityDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  available_date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  start_time: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  end_time: string;
}
import { IsString, Matches } from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreateAvailabilityDto {
  @Matches(UUID_REGEX, UUID_MSG)
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
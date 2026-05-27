import { Matches } from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreateAssignmentDto {
  @Matches(UUID_REGEX, UUID_MSG)
  booking_id: string;

  @Matches(UUID_REGEX, UUID_MSG)
  employee_id: string;
}
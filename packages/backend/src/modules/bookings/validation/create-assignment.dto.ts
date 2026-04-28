import { IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  booking_id: string;

  @IsUUID()
  employee_id: string;
}
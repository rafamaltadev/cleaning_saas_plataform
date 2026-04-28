import { Assignment } from './assignment.entity';

export class AssignmentResponseDto {
  id: string;
  tenant_id: string;
  booking_id: string;
  employee_id: string;
  status: string;
  assigned_at: Date;
  completed_at: Date | null;

  static from(assignment: Assignment): AssignmentResponseDto {
    const dto = new AssignmentResponseDto();
    dto.id = assignment.id;
    dto.tenant_id = assignment.tenant_id;
    dto.booking_id = assignment.booking_id;
    dto.employee_id = assignment.employee_id;
    dto.status = assignment.status;
    dto.assigned_at = assignment.assigned_at;
    dto.completed_at = assignment.completed_at;
    return dto;
  }
}
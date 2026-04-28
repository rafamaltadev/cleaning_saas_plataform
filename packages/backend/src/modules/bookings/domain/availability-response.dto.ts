import { Availability } from './availability.entity';

export class AvailabilityResponseDto {
  id: string;
  tenant_id: string;
  employee_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  created_at: Date;
  updated_at: Date;

  static from(availability: Availability): AvailabilityResponseDto {
    const dto = new AvailabilityResponseDto();
    dto.id = availability.id;
    dto.tenant_id = availability.tenant_id;
    dto.employee_id = availability.employee_id;
    dto.available_date = availability.available_date;
    dto.start_time = availability.start_time;
    dto.end_time = availability.end_time;
    dto.created_at = availability.created_at;
    dto.updated_at = availability.updated_at;
    return dto;
  }
}
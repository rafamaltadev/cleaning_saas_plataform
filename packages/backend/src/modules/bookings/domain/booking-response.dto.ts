import { Booking } from './booking.entity';

interface BookingContext {
  clientName?: string;
  serviceName?: string;
}

export class BookingResponseDto {
  id: string;
  tenant_id: string;
  quote_id: string;
  client_id: string;
  service_id: string;
  scheduled_start: Date;
  scheduled_end: Date;
  status: string;
  assigned_team: string | null;
  idempotency_key: string;
  created_at: Date;
  updated_at: Date;
  client_name?: string;
  service_name?: string;

  static from(booking: Booking, context?: BookingContext): BookingResponseDto {
    const dto = new BookingResponseDto();
    dto.id = booking.id;
    dto.tenant_id = booking.tenant_id;
    dto.quote_id = booking.quote_id;
    dto.client_id = booking.client_id;
    dto.service_id = booking.service_id;
    dto.scheduled_start = booking.scheduled_start;
    dto.scheduled_end = booking.scheduled_end;
    dto.status = booking.status;
    dto.assigned_team = booking.assigned_team;
    dto.idempotency_key = booking.idempotency_key;
    dto.created_at = booking.created_at;
    dto.updated_at = booking.updated_at;
    if (context?.clientName) dto.client_name = context.clientName;
    if (context?.serviceName) dto.service_name = context.serviceName;
    return dto;
  }
}
import { Notification } from './notification.entity';

export class NotificationResponseDto {
  id: string;
  tenant_id: string;
  client_id: string | null;
  booking_id: string | null;
  quote_id: string | null;
  type: string;
  template: string;
  status: string;
  sent_at: Date | null;
  payload: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;

  static from(n: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = n.id;
    dto.tenant_id = n.tenant_id;
    dto.client_id = n.client_id;
    dto.booking_id = n.booking_id;
    dto.quote_id = n.quote_id;
    dto.type = n.type;
    dto.template = n.template;
    dto.status = n.status;
    dto.sent_at = n.sent_at;
    dto.payload = n.payload;
    dto.created_at = n.created_at;
    dto.updated_at = n.updated_at;
    return dto;
  }
}

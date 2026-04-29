import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../domain/notification.entity';

export class SendNotificationDto {
  @IsIn(['email', 'sms'])
  type: NotificationType;

  @IsString()
  template: string;

  @IsString()
  to: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @IsUUID()
  booking_id?: string;

  @IsOptional()
  @IsUUID()
  quote_id?: string;
}

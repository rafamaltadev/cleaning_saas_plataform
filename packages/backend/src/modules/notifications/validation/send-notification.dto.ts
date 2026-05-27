import { IsIn, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';
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
  @Matches(UUID_REGEX, UUID_MSG)
  client_id?: string;

  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
  booking_id?: string;

  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
  quote_id?: string;
}

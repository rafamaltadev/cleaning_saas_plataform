import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Booking UUID' })
  @IsString()
  @Matches(UUID_REGEX, UUID_MSG)
  booking_id: string;
}

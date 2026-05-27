import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreatePaymentDto {
  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
  booking_id?: string;

  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
  quote_id?: string;

  @IsInt()
  @Min(0)
  amount_cents: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  external_reference?: string;

  @IsString()
  idempotency_key: string;
}

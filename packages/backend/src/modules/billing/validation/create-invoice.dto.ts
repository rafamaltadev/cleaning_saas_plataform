import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreateInvoiceDto {
  @Matches(UUID_REGEX, UUID_MSG)
  booking_id: string;

  @Matches(UUID_REGEX, UUID_MSG)
  client_id: string;

  @IsInt()
  @Min(0)
  total_cents: number;

  @IsString()
  currency: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsIn(['draft', 'issued', 'paid'])
  status?: 'draft' | 'issued' | 'paid';
}

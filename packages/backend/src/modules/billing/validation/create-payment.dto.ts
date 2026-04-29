import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  booking_id?: string;

  @IsOptional()
  @IsUUID()
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

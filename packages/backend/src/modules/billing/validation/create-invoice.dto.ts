import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  booking_id: string;

  @IsUUID()
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

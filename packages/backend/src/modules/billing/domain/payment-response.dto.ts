import { Payment } from './payment.entity';

export class PaymentResponseDto {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  quote_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  payment_method: string;
  external_reference: string | null;
  idempotency_key: string;
  created_at: Date;
  updated_at: Date;

  static from(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.tenant_id = payment.tenant_id;
    dto.booking_id = payment.booking_id;
    dto.quote_id = payment.quote_id;
    dto.amount_cents = payment.amount_cents;
    dto.currency = payment.currency;
    dto.status = payment.status;
    dto.payment_method = payment.payment_method;
    dto.external_reference = payment.external_reference;
    dto.idempotency_key = payment.idempotency_key;
    dto.created_at = payment.created_at;
    dto.updated_at = payment.updated_at;
    return dto;
  }
}

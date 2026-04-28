import { Quote } from './quote.entity';

export class QuoteResponseDto {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  pricing_rule_id: string | null;
  status: string;
  estimated_total_cents: number;
  currency: string;
  valid_until: Date;
  manual_discount_percent: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;

  static from(quote: Quote): QuoteResponseDto {
    const dto = new QuoteResponseDto();
    dto.id = quote.id;
    dto.tenant_id = quote.tenant_id;
    dto.client_id = quote.client_id;
    dto.service_id = quote.service_id;
    dto.pricing_rule_id = quote.pricing_rule_id;
    dto.status = quote.status;
    dto.estimated_total_cents = quote.estimated_total_cents;
    dto.currency = quote.currency;
    dto.valid_until = quote.valid_until;
    dto.manual_discount_percent = quote.manual_discount_percent;
    dto.created_by = quote.created_by;
    dto.created_at = quote.created_at;
    dto.updated_at = quote.updated_at;
    return dto;
  }
}

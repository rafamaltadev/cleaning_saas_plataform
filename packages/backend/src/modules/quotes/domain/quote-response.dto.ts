import { Quote } from './quote.entity';

interface QuoteContext {
  clientName?: string;
  serviceName?: string;
  pricingRuleName?: string;
}

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
  service_address: string | null;
  use_client_address: boolean;
  observations: string | null;
  service_date: Date | null;
  created_at: Date;
  updated_at: Date;
  client_name?: string;
  service_name?: string;
  pricing_rule_name?: string;

  static from(quote: Quote, context?: QuoteContext): QuoteResponseDto {
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
    dto.service_address = quote.service_address ?? null;
    dto.use_client_address = quote.use_client_address ?? true;
    dto.observations = quote.observations ?? null;
    dto.service_date = quote.service_date ?? null;
    dto.created_at = quote.created_at;
    dto.updated_at = quote.updated_at;
    if (context?.clientName) dto.client_name = context.clientName;
    if (context?.serviceName) dto.service_name = context.serviceName;
    if (context?.pricingRuleName) dto.pricing_rule_name = context.pricingRuleName;
    return dto;
  }
}

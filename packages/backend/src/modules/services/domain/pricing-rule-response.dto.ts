import { PricingRule } from './pricing-rule.entity';

export class PricingRuleResponseDto {
  id: string;
  tenant_id: string;
  service_id: string;
  min_area: number | null;
  max_area: number | null;
  frequency: string;
  discount_percent: number;
  price_multiplier: number;
  created_at: Date;
  updated_at: Date;

  static from(rule: PricingRule): PricingRuleResponseDto {
    const dto = new PricingRuleResponseDto();
    dto.id = rule.id;
    dto.tenant_id = rule.tenant_id;
    dto.service_id = rule.service_id;
    dto.min_area = rule.min_area;
    dto.max_area = rule.max_area;
    dto.frequency = rule.frequency;
    dto.discount_percent = rule.discount_percent;
    dto.price_multiplier = Number(rule.price_multiplier);
    dto.created_at = rule.created_at;
    dto.updated_at = rule.updated_at;
    return dto;
  }
}

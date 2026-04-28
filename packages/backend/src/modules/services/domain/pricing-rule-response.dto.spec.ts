import { PricingRuleResponseDto } from './pricing-rule-response.dto';
import { PricingRule } from './pricing-rule.entity';

function makeRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'rule-uuid',
    tenant_id: 'tenant-uuid',
    service_id: 'service-uuid',
    min_area: null,
    max_area: 100,
    frequency: 'monthly',
    discount_percent: 10,
    price_multiplier: 1.5,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('PricingRuleResponseDto', () => {
  it('maps all expected fields from PricingRule entity', () => {
    const rule = makeRule();
    const dto = PricingRuleResponseDto.from(rule);

    expect(dto.id).toBe('rule-uuid');
    expect(dto.tenant_id).toBe('tenant-uuid');
    expect(dto.service_id).toBe('service-uuid');
    expect(dto.min_area).toBeNull();
    expect(dto.max_area).toBe(100);
    expect(dto.frequency).toBe('monthly');
    expect(dto.discount_percent).toBe(10);
    expect(dto.price_multiplier).toBe(1.5);
    expect(dto.created_at).toEqual(new Date('2024-01-01'));
    expect(dto.updated_at).toEqual(new Date('2024-06-01'));
  });

  it('does not include deleted_at', () => {
    const dto = PricingRuleResponseDto.from(makeRule({ deleted_at: new Date() }));
    expect(dto).not.toHaveProperty('deleted_at');
  });

  it('returns an instance of PricingRuleResponseDto', () => {
    expect(PricingRuleResponseDto.from(makeRule())).toBeInstanceOf(PricingRuleResponseDto);
  });

  it('coerces price_multiplier to Number', () => {
    const dto = PricingRuleResponseDto.from(makeRule({ price_multiplier: '1.2500' as any }));
    expect(typeof dto.price_multiplier).toBe('number');
    expect(dto.price_multiplier).toBe(1.25);
  });
});

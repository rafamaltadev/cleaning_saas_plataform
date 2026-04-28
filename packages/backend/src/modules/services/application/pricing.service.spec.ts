import { PricingService } from './pricing.service';

describe('PricingService.calculate()', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  it('unit sqm: result equals base_rate_cents × area_sqm before discounts', () => {
    const result = service.calculate({ unit: 'sqm', base_rate_cents: 100, area_sqm: 50 });
    expect(result).toBe(5000);
  });

  it('unit hour: result equals base_rate_cents × duration_hours before discounts', () => {
    const result = service.calculate({ unit: 'hour', base_rate_cents: 200, duration_hours: 3 });
    expect(result).toBe(600);
  });

  it('unit flat: result equals base_rate_cents regardless of area or duration inputs', () => {
    const result = service.calculate({
      unit: 'flat',
      base_rate_cents: 500,
      area_sqm: 999,
      duration_hours: 999,
    });
    expect(result).toBe(500);
  });

  it('applies price_multiplier before discount_percent', () => {
    // base=100, sqm, area=1, multiplier=2 → 200; discount=50% → 100
    const result = service.calculate({
      unit: 'sqm',
      base_rate_cents: 100,
      area_sqm: 1,
      price_multiplier: 2,
      discount_percent: 50,
    });
    expect(result).toBe(100);
  });

  it('applies manual_discount_percent last', () => {
    // base=1000, flat, price_multiplier=1, discount=0%, manual=10% → 900
    const withoutManual = service.calculate({ unit: 'flat', base_rate_cents: 1000 });
    const withManual = service.calculate({
      unit: 'flat',
      base_rate_cents: 1000,
      manual_discount_percent: 10,
    });
    expect(withoutManual).toBe(1000);
    expect(withManual).toBe(900);
  });

  it('returns an integer (rounds to nearest cent)', () => {
    // base=100, flat, discount=33%: 100 * 0.67 = 67
    const result = service.calculate({
      unit: 'flat',
      base_rate_cents: 100,
      discount_percent: 33,
    });
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(67);
  });

  it('applies full chain: sqm × area × multiplier × (1-discount) × (1-manual) rounded', () => {
    // base=1000, sqm, area=2, multiplier=1.5, discount=10%, manual=5%
    // 1000*2=2000 → *1.5=3000 → *0.9=2700 → *0.95=2565
    const result = service.calculate({
      unit: 'sqm',
      base_rate_cents: 1000,
      area_sqm: 2,
      price_multiplier: 1.5,
      discount_percent: 10,
      manual_discount_percent: 5,
    });
    expect(result).toBe(2565);
  });

  it('defaults to no multiplier and no discounts when omitted', () => {
    const result = service.calculate({ unit: 'flat', base_rate_cents: 300 });
    expect(result).toBe(300);
  });

  it('unit hour defaults duration_hours to 1 when omitted', () => {
    const result = service.calculate({ unit: 'hour', base_rate_cents: 150 });
    expect(result).toBe(150);
  });

  it('unit sqm defaults area_sqm to 1 when omitted', () => {
    const result = service.calculate({ unit: 'sqm', base_rate_cents: 200 });
    expect(result).toBe(200);
  });
});

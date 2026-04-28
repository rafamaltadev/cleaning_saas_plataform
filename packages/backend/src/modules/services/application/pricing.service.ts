import { Injectable } from '@nestjs/common';

export interface PriceCalculationParams {
  unit: 'sqm' | 'hour' | 'flat';
  base_rate_cents: number;
  area_sqm?: number;
  duration_hours?: number;
  price_multiplier?: number;
  discount_percent?: number;
  manual_discount_percent?: number;
}

@Injectable()
export class PricingService {
  calculate(params: PriceCalculationParams): number {
    const {
      unit,
      base_rate_cents,
      area_sqm = 1,
      duration_hours = 1,
      price_multiplier = 1,
      discount_percent = 0,
      manual_discount_percent = 0,
    } = params;

    let price: number;
    if (unit === 'sqm') {
      price = base_rate_cents * area_sqm;
    } else if (unit === 'hour') {
      price = base_rate_cents * duration_hours;
    } else {
      price = base_rate_cents;
    }

    price = price * price_multiplier;
    price = price * (1 - discount_percent / 100);
    price = price * (1 - manual_discount_percent / 100);

    return Math.round(price);
  }
}

export interface PriceParams {
  unit: 'sqm' | 'hour' | 'flat';
  baseRateCents: number;
  areaSqm?: number;
  durationHours?: number;
  priceMultiplier?: number;
  discountPercent?: number;
  manualDiscountPercent?: number;
}

export function calculatePriceCents(params: PriceParams): number {
  const {
    unit,
    baseRateCents,
    areaSqm = 1,
    durationHours = 1,
    priceMultiplier = 1,
    discountPercent = 0,
    manualDiscountPercent = 0,
  } = params;

  let price: number;
  if (unit === 'sqm') {
    price = baseRateCents * areaSqm;
  } else if (unit === 'hour') {
    price = baseRateCents * durationHours;
  } else {
    price = baseRateCents;
  }

  price = price * priceMultiplier;
  price = price * (1 - discountPercent / 100);
  price = price * (1 - manualDiscountPercent / 100);

  return Math.round(price);
}

export function formatCurrency(cents: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

import axios from 'axios';

const publicClient = axios.create({ baseURL: '/api/v1/public' });

export interface PublicAddon {
  id: string;
  name: string;
  price_cents: number;
}

export interface QuoteEstimateRequest {
  service_id: string;
  area_sqm?: number;
  duration_hours?: number;
  manual_discount_percent?: number;
  addon_ids?: string[];
}

export interface QuoteEstimateResponse {
  subtotal_cents: number;
  addon_total_cents: number;
  discount_amount_cents: number;
  estimated_total_cents: number;
  currency: string;
}

export async function getPublicServiceAddons(
  tenantSlug: string,
  serviceId: string,
): Promise<PublicAddon[]> {
  const { data } = await publicClient.get<{ data: PublicAddon[] }>(
    `/${tenantSlug}/services/${serviceId}/addons`,
  );
  return data.data;
}

export async function postQuoteEstimate(
  tenantSlug: string,
  payload: QuoteEstimateRequest,
): Promise<QuoteEstimateResponse> {
  const { data } = await publicClient.post<{ data: QuoteEstimateResponse }>(
    `/${tenantSlug}/quote-estimate`,
    payload,
  );
  return data.data;
}

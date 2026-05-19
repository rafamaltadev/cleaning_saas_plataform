import axios from 'axios';

const publicClient = axios.create({ baseURL: '/api/v1/public' });

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicQuoteResult {
  id: string;
  status: string;
  estimated_total_cents: number;
}

export interface PublicQuotePayload {
  service_id: string;
  area_sqm?: number;
  duration_hours?: number;
  addon_ids?: string[];
  address: string;
  city: string;
  state: string;
  postal_code: string;
  observations?: string;
  estimated_total_cents?: number;
}

export async function registerPublicUser(
  tenantSlug: string,
  payload: { name: string; email: string; password: string; confirmPassword: string; phone: string },
): Promise<AuthTokens> {
  const { data } = await publicClient.post<{ data: AuthTokens }>(
    `/${tenantSlug}/auth/register`,
    payload,
  );
  return data.data;
}

export async function loginPublicUser(
  tenantSlug: string,
  payload: { email: string; password: string },
): Promise<AuthTokens> {
  const { data } = await publicClient.post<{ data: AuthTokens }>(
    `/${tenantSlug}/auth/login`,
    payload,
  );
  return data.data;
}

export async function createPublicQuote(
  tenantSlug: string,
  accessToken: string,
  payload: PublicQuotePayload,
): Promise<PublicQuoteResult> {
  const { data } = await publicClient.post<{ data: PublicQuoteResult }>(
    `/${tenantSlug}/quotes`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.data;
}

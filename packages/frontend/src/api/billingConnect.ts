import { apiClient } from './client';

export interface StripeTermsVersion {
  id: string;
  version: string;
  country: string;
  language: string;
  content: string;
  platform_fee_percent: number;
  stripe_fee_card_percent: number;
  stripe_fee_pix_percent: number | null;
  stripe_fee_ach_percent: number | null;
  effective_from: string;
  effective_until: string | null;
}

export interface ConnectStatus {
  connected: boolean;
  stripe_connect_status: string | null;
  stripe_connect_charges_enabled: boolean;
  stripe_connect_payouts_enabled: boolean;
  stripe_connect_requirements: object | null;
  payment_mode: string;
  payment_timing: string;
}

export interface PaymentConfig {
  payment_mode: string;
  payment_timing: string;
}

export async function getConnectTerms(params: {
  country: string;
  language: string;
}): Promise<StripeTermsVersion> {
  const { data } = await apiClient.get<{ data: StripeTermsVersion }>(
    `/billing/connect/terms?country=${params.country}&language=${params.language}`,
  );
  return data.data;
}

export async function acceptConnectTerms(terms_version: string): Promise<{ id: string; accepted_at: string }> {
  const { data } = await apiClient.post<{ data: { id: string; accepted_at: string } }>(
    '/billing/connect/accept-terms',
    { terms_version },
  );
  return data.data;
}

export async function startOnboarding(params: {
  country: string;
  email: string;
}): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ data: { url: string } }>(
    '/billing/connect/start-onboarding',
    params,
  );
  return data.data;
}

export async function getConnectStatus(): Promise<ConnectStatus> {
  const { data } = await apiClient.get<{ data: ConnectStatus }>('/billing/connect/status');
  return data.data;
}

export async function getConnectDashboardLink(): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ data: { url: string } }>('/billing/connect/dashboard-link');
  return data.data;
}

export async function disconnectStripeAccount(): Promise<{ disconnected: boolean }> {
  const { data } = await apiClient.delete<{ data: { disconnected: boolean } }>('/billing/connect/disconnect');
  return data.data;
}

export async function updatePaymentConfig(config: PaymentConfig): Promise<PaymentConfig> {
  const { data } = await apiClient.put<{ data: PaymentConfig }>('/billing/payment-config', config);
  return data.data;
}

import { apiClient } from './client';

export interface ApiPayment {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  quote_id: string | null;
  client_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount_cents: number;
  application_fee_cents: number;
  stripe_fee_cents: number | null;
  net_amount_cents: number | null;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'manual_pending' | 'completed';
  payment_method: string;
  payment_mode: 'manual' | 'stripe';
  payment_timing: 'prepaid' | 'postpaid';
  paid_at: string | null;
  refunded_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
  paymentMethods: string[];
}

export async function createPublicPaymentIntent(
  tenantSlug: string,
  bookingId: string,
): Promise<PaymentIntentResponse> {
  const { data } = await apiClient.post<PaymentIntentResponse>(
    `/public/${tenantSlug}/payments/intent`,
    { booking_id: bookingId },
  );
  return data;
}

export async function getMyPublicPayments(tenantSlug: string): Promise<ApiPayment[]> {
  const { data } = await apiClient.get<ApiPayment[]>(`/public/${tenantSlug}/payments/my`);
  return data;
}

export async function listAdminPayments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ApiPayment[]; total: number }> {
  const { data } = await apiClient.get<{ items: ApiPayment[]; total: number }>('/billing/payments', {
    params,
  });
  return data;
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string,
): Promise<ApiPayment> {
  const { data } = await apiClient.post<ApiPayment>(`/billing/payments/${paymentId}/refund`, {
    amount,
    reason,
  });
  return data;
}

export async function sendPaymentLink(paymentId: string): Promise<void> {
  await apiClient.post(`/billing/payments/${paymentId}/send-payment-link`);
}

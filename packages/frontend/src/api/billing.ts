import { apiClient } from './client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  interval: 'month' | 'semiannual' | 'year';
  interval_count: number;
  amount_cents: number;
  currency: string;
  is_active: boolean;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_ends_at: string | null;
  grandfathered_price_cents: number;
  discount_ratio: number | null;
  created_at: string;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<{ data: SubscriptionPlan[] }>('/billing/plans');
  return data.data;
}

export async function getMySubscription(): Promise<TenantSubscription | null> {
  const { data } = await apiClient.get<{ data: TenantSubscription | null }>('/billing/subscription/me');
  return data.data;
}

export async function createCheckout(params: {
  plan_id: string;
  success_url: string;
  cancel_url: string;
}): Promise<CheckoutSession> {
  const { data } = await apiClient.post<{ data: CheckoutSession }>('/billing/checkout', params);
  return data.data;
}

export async function openPortal(returnUrl?: string): Promise<{ url: string }> {
  const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
  const { data } = await apiClient.post<{ data: { url: string } }>(`/billing/portal${params}`);
  return data.data;
}

export async function cancelSubscription(params: {
  at_period_end: boolean;
  reason?: string;
}): Promise<TenantSubscription> {
  const { data } = await apiClient.post<{ data: TenantSubscription }>('/billing/subscription/cancel', params);
  return data.data;
}

export async function changePlan(plan_id: string): Promise<TenantSubscription> {
  const { data } = await apiClient.post<{ data: TenantSubscription }>('/billing/subscription/change-plan', { plan_id });
  return data.data;
}

export async function adminGetPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<{ data: SubscriptionPlan[] }>('/admin/subscription-plans');
  return data.data;
}

export async function adminCreatePlan(plan: {
  name: string;
  description?: string;
  tier: string;
  interval: 'month' | 'semiannual' | 'year';
  interval_count: number;
  amount_cents: number;
  currency: 'BRL' | 'USD';
}): Promise<SubscriptionPlan> {
  const { data } = await apiClient.post<{ data: SubscriptionPlan }>('/admin/subscription-plans', plan);
  return data.data;
}

export async function adminUpdatePlan(
  id: string,
  updates: Partial<SubscriptionPlan>,
): Promise<SubscriptionPlan> {
  const { data } = await apiClient.put<{ data: SubscriptionPlan }>(`/admin/subscription-plans/${id}`, updates);
  return data.data;
}

export async function adminDeletePlan(id: string): Promise<void> {
  await apiClient.delete(`/admin/subscription-plans/${id}`);
}

export async function adminGetSubscriptions(filters?: {
  status?: string;
  tenant_id?: string;
  plan_id?: string;
}): Promise<TenantSubscription[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.tenant_id) params.set('tenant_id', filters.tenant_id);
  if (filters?.plan_id) params.set('plan_id', filters.plan_id);
  const { data } = await apiClient.get<{ data: TenantSubscription[] }>(
    `/admin/subscriptions${params.toString() ? '?' + params.toString() : ''}`,
  );
  return data.data;
}

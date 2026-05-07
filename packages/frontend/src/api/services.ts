import { apiClient } from './client';
import type { Service, ApiPricingRule } from '../types';

export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get('/services');
  return data.data.items;
}

export interface CreateServicePayload {
  name: string;
  description: string;
  base_rate_cents: number;
  unit: 'sqm' | 'hour' | 'flat';
}

export interface CreatePricingRulePayload {
  service_id: string;
  frequency: string;
  discount_percent: number;
  price_multiplier: number;
  min_area: number | null;
  max_area: number | null;
}

export async function getServiceById(id: string): Promise<Service> {
  const { data } = await apiClient.get<{ data: Service }>(`/services/${id}`);
  return data.data;
}

export async function createService(payload: CreateServicePayload): Promise<Service> {
  const { data } = await apiClient.post<{ data: Service }>('/services', payload);
  return data.data;
}

export async function updateService(id: string, payload: Partial<CreateServicePayload>): Promise<Service> {
  const { data } = await apiClient.put<{ data: Service }>(`/services/${id}`, payload);
  return data.data;
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}

export async function getPricingRuleForService(serviceId: string): Promise<ApiPricingRule | null> {
  try {
    const { data } = await apiClient.get<{ data: ApiPricingRule }>(`/pricing-rules/by-service/${serviceId}`);
    return data.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw err;
  }
}

export async function createPricingRule(payload: CreatePricingRulePayload): Promise<ApiPricingRule> {
  const { data } = await apiClient.post<{ data: ApiPricingRule }>('/pricing-rules', payload);
  return data.data;
}

export async function updatePricingRule(id: string, payload: Partial<CreatePricingRulePayload>): Promise<ApiPricingRule> {
  const { data } = await apiClient.put<{ data: ApiPricingRule }>(`/pricing-rules/${id}`, payload);
  return data.data;
}

import { apiClient } from './client';
import type { Tenant } from '../types';

export async function getTenant(): Promise<Tenant> {
  const { data } = await apiClient.get<{ data: Tenant }>('/tenants/me');
  return data.data;
}

export async function updateTenant(payload: Partial<Tenant>): Promise<Tenant> {
  const { data } = await apiClient.put<{ data: Tenant }>('/tenants/me', payload);
  return data.data;
}


import { apiClient } from './client';
import type { Tenant, Service } from '../types';

export async function getTenant(): Promise<Tenant> {
  const { data } = await apiClient.get<Tenant>('/tenants/me');
  return data;
}

export async function updateTenant(payload: Partial<Tenant>): Promise<Tenant> {
  const { data } = await apiClient.put<Tenant>('/tenants/me', payload);
  return data;
}

export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get<{ data: Service[] }>('/services');
  return data.data;
}

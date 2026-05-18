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

export async function uploadLogo(file: File): Promise<{ logo_url: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ data: { logo_url: string } }>('/tenants/me/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function uploadFavicon(file: File): Promise<{ favicon_url: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ data: { favicon_url: string } }>('/tenants/me/favicon', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

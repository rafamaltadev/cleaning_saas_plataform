import { apiClient } from './client';
import type { ServiceAddon } from '../types';

export interface AddonPayload {
  name: string;
  price_cents: number;
}

export async function getAddonsByService(serviceId: string): Promise<ServiceAddon[]> {
  const { data } = await apiClient.get<{ data: ServiceAddon[] }>(`/services/${serviceId}/addons`);
  return data.data;
}

export async function createAddon(serviceId: string, payload: AddonPayload): Promise<ServiceAddon> {
  const { data } = await apiClient.post<{ data: ServiceAddon }>(
    `/services/${serviceId}/addons`,
    { ...payload, service_id: serviceId },
  );
  return data.data;
}

export async function updateAddon(
  serviceId: string,
  id: string,
  payload: Partial<AddonPayload>,
): Promise<ServiceAddon> {
  const { data } = await apiClient.put<{ data: ServiceAddon }>(
    `/services/${serviceId}/addons/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteAddon(serviceId: string, id: string): Promise<void> {
  await apiClient.delete(`/services/${serviceId}/addons/${id}`);
}

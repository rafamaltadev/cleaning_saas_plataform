import { apiClient } from './client';
import type { Client, PaginatedResponse, PaginatedApiResult } from '../types';

export interface ClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  phone: string;
  preferred_language: 'pt-BR' | 'en' | 'es';
}

export interface AddressPayload {
  client_id: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export async function getClients(query: ClientsQuery = {}): Promise<PaginatedResponse<Client>> {
  const { data } = await apiClient.get<{ data: PaginatedApiResult<Client> }>('/clients', { params: query });
  return {
    data: data.data.items,
    total: data.data.meta.total,
    page: data.data.meta.page,
    limit: data.data.meta.limit,
  };
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await apiClient.get<{ data: Client }>(`/clients/${id}`);
  return data.data;
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await apiClient.post<{ data: Client }>('/clients', payload);
  return data.data;
}

export async function updateClient(id: string, payload: Partial<CreateClientPayload>): Promise<Client> {
  const { data } = await apiClient.put<{ data: Client }>(`/clients/${id}`, payload);
  return data.data;
}

export async function createAddress(payload: AddressPayload): Promise<void> {
  await apiClient.post('/addresses', payload);
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}

import { apiClient } from './client';
import type { Client, PaginatedResponse } from '../types';

export interface ClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export async function getClients(query: ClientsQuery = {}): Promise<PaginatedResponse<Client>> {
  const { data } = await apiClient.get<PaginatedResponse<Client>>('/clients', { params: query });
  return data;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await apiClient.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await apiClient.post<Client>('/clients', payload);
  return data;
}

export async function updateClient(id: string, payload: Partial<CreateClientPayload>): Promise<Client> {
  const { data } = await apiClient.put<Client>(`/clients/${id}`, payload);
  return data;
}

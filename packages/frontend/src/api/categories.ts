import { apiClient } from './client';
import type { ServiceCategory } from '../types';

export async function getCategories(): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<{ data: ServiceCategory[] }>('/categories');
  return data.data;
}

export async function createCategory(name: string): Promise<ServiceCategory> {
  const { data } = await apiClient.post<{ data: ServiceCategory }>('/categories', { name });
  return data.data;
}

export async function updateCategory(id: string, name: string): Promise<ServiceCategory> {
  const { data } = await apiClient.put<{ data: ServiceCategory }>(`/categories/${id}`, { name });
  return data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

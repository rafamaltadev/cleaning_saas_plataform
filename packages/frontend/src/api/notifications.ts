import { apiClient } from './client';
import type { ApiNotification } from '../types';

export async function getNotifications(params: { limit?: number } = {}): Promise<ApiNotification[]> {
  const { data } = await apiClient.get<{ data: ApiNotification[] }>('/notifications', { params });
  return data.data;
}

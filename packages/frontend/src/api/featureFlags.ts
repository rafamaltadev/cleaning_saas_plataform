import { apiClient } from './client';
import type { FeatureFlags } from '../types';

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const { data } = await apiClient.get<{ data: FeatureFlags }>('/feature-flags');
  return data.data;
}

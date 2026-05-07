import { apiClient } from './client';
import type { ApiPricingRule, PaginatedApiResult } from '../types';

export async function getPricingRules(): Promise<ApiPricingRule[]> {
  const { data } = await apiClient.get<{ data: PaginatedApiResult<ApiPricingRule> }>('/pricing-rules', {
    params: { page: 1, limit: 100 },
  });
  return data.data.items;
}

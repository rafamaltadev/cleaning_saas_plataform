import { apiClient } from './client';
import type { QuoteAddon } from '../types';

export interface SyncAddonPayload {
  addon_id: string;
  name: string;
  price_cents: number;
}

export async function getQuoteAddons(quoteId: string): Promise<QuoteAddon[]> {
  const { data } = await apiClient.get<{ data: QuoteAddon[] }>(`/quotes/${quoteId}/addons`);
  return data.data;
}

export async function syncQuoteAddons(
  quoteId: string,
  addons: SyncAddonPayload[],
): Promise<void> {
  await apiClient.post(`/quotes/${quoteId}/addons/sync`, { addons });
}

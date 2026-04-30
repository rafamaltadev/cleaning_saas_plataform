import { apiClient } from './client';
import type { Quote, QuoteStatus } from '../types';

export async function getQuotes(): Promise<Quote[]> {
  const { data } = await apiClient.get<Quote[]>('/quotes');
  return data;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
  const { data } = await apiClient.put<Quote>(`/quotes/${id}`, { status });
  return data;
}

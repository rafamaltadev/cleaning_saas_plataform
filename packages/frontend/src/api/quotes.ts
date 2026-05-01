import { apiClient } from './client';
import type { Quote, QuoteStatus, ApiQuote, PaginatedApiResult } from '../types';

export async function getQuotes(): Promise<Quote[]> {
  const { data } = await apiClient.get<Quote[]>('/quotes');
  return data;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
  const { data } = await apiClient.put<Quote>(`/quotes/${id}`, { status });
  return data;
}

// ── T14 paginated API ────────────────────────────────────────────────────────

export interface QuotesQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateQuotePayload {
  client_id: string;
  service_id: string;
  pricing_rule_id?: string;
  currency: string;
  valid_until: string;
  manual_discount_percent?: number;
  area_sqm?: number;
  duration_hours?: number;
}

export async function listQuotes(query: QuotesQuery = {}): Promise<PaginatedApiResult<ApiQuote>> {
  const params = { page: query.page ?? 1, limit: query.limit ?? 20, ...query };
  const { data } = await apiClient.get<PaginatedApiResult<ApiQuote>>('/quotes', { params });
  return data;
}

export async function getQuoteById(id: string): Promise<ApiQuote> {
  const { data } = await apiClient.get<ApiQuote>(`/quotes/${id}`);
  return data;
}

export async function createQuote(payload: CreateQuotePayload): Promise<ApiQuote> {
  const { data } = await apiClient.post<ApiQuote>('/quotes', payload);
  return data;
}

export async function sendQuote(id: string): Promise<ApiQuote> {
  const { data } = await apiClient.post<ApiQuote>(`/quotes/${id}/send`);
  return data;
}

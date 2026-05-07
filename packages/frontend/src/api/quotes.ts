import { apiClient } from './client';
import type { Quote, QuoteStatus, ApiQuote, PaginatedApiResult } from '../types';

export async function getQuotes(): Promise<PaginatedApiResult<ApiQuote>> {
  const { data } = await apiClient.get<{ data: PaginatedApiResult<ApiQuote> }>('/quotes');
  return data.data;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
  const { data } = await apiClient.put<{ data: Quote }>(`/quotes/${id}`, { status });
  return data.data;
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
  const { data } = await apiClient.get<{ data: PaginatedApiResult<ApiQuote> }>('/quotes', { params });
  return data.data;
}

export async function getQuoteById(id: string): Promise<ApiQuote> {
  const { data } = await apiClient.get<{ data: ApiQuote }>(`/quotes/${id}`);
  return data.data;
}

export async function createQuote(payload: CreateQuotePayload): Promise<ApiQuote> {
  const { data } = await apiClient.post<{ data: ApiQuote }>('/quotes', payload);
  return data.data;
}

export async function sendQuote(id: string): Promise<ApiQuote> {
  const { data } = await apiClient.post<{ data: ApiQuote }>(`/quotes/${id}/send`);
  return data.data;
}

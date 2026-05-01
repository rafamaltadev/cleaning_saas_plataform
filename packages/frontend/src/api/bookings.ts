import { apiClient } from './client';
import type { Booking, BookingStatus, ApiBooking, PaginatedApiResult } from '../types';

export async function getBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings');
  return data;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const { data } = await apiClient.put<Booking>(`/bookings/${id}`, { status });
  return data;
}

// ── T14 paginated API ────────────────────────────────────────────────────────

export interface BookingsQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateBookingPayload {
  quote_id: string;
  client_id: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  assigned_team?: string;
  idempotency_key: string;
}

export async function listBookings(query: BookingsQuery = {}): Promise<PaginatedApiResult<ApiBooking>> {
  const params = { page: query.page ?? 1, limit: query.limit ?? 20, ...query };
  const { data } = await apiClient.get<PaginatedApiResult<ApiBooking>>('/bookings', { params });
  return data;
}

export async function getBookingById(id: string): Promise<ApiBooking> {
  const { data } = await apiClient.get<ApiBooking>(`/bookings/${id}`);
  return data;
}

export async function createBooking(payload: CreateBookingPayload): Promise<ApiBooking> {
  const { data } = await apiClient.post<ApiBooking>('/bookings', payload);
  return data;
}

export async function completeBooking(id: string): Promise<ApiBooking> {
  const { data } = await apiClient.post<ApiBooking>(`/bookings/${id}/complete`);
  return data;
}

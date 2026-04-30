import { apiClient } from './client';
import type { Booking, BookingStatus } from '../types';

export async function getBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings');
  return data;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const { data } = await apiClient.put<Booking>(`/bookings/${id}`, { status });
  return data;
}

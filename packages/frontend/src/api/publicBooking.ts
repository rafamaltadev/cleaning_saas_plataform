import axios from 'axios';
import { clearPublicSession } from '../utils/publicSession';

const publicClient = axios.create({ baseURL: '/api/v1/public' });

let _interceptorId: number | null = null;

export function setupPublicBookingInterceptor(tenantSlug: string): void {
  if (_interceptorId !== null) {
    publicClient.interceptors.response.eject(_interceptorId);
  }
  _interceptorId = publicClient.interceptors.response.use(
    (res) => res,
    (err: import('axios').AxiosError) => {
      if (err.response?.status === 401) {
        clearPublicSession(tenantSlug);
        window.location.href = `/t/${tenantSlug}/orcamento/cadastro?sessionExpired=1`;
      }
      return Promise.reject(err);
    },
  );
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface PublicBookingPayload {
  quote_id: string;
  scheduled_start: string;
  scheduled_end: string;
  service_address?: string;
  observations?: string;
}

export interface PublicBookingResult {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  service_address: string | null;
  use_client_address: boolean;
  observations: string | null;
  origin: string;
  approval_required: boolean;
  quote_id: string;
  service_id: string;
  client_id: string;
  created_at: string;
}

export interface MyBooking {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  service_address: string | null;
  use_client_address: boolean;
  observations: string | null;
  origin: string;
  approval_required: boolean;
  service_name?: string;
  created_at: string;
}

export async function getPublicAvailability(
  tenantSlug: string,
  from: string,
  to: string,
): Promise<DayAvailability[]> {
  const { data } = await publicClient.get<{ data: DayAvailability[] }>(
    `/${tenantSlug}/availability`,
    { params: { from, to } },
  );
  return data.data;
}

export async function createPublicBooking(
  tenantSlug: string,
  accessToken: string,
  payload: PublicBookingPayload,
): Promise<PublicBookingResult> {
  const { data } = await publicClient.post<{ data: PublicBookingResult }>(
    `/${tenantSlug}/bookings`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.data;
}

export async function getMyBookings(
  tenantSlug: string,
  accessToken: string,
): Promise<MyBooking[]> {
  const { data } = await publicClient.get<{ data: MyBooking[] }>(
    `/${tenantSlug}/bookings/my`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.data;
}

export async function getMyBookingsCount(
  tenantSlug: string,
  accessToken: string,
): Promise<number> {
  const { data } = await publicClient.get<{ data: { count: number } }>(
    `/${tenantSlug}/bookings/my/count`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.data.count;
}

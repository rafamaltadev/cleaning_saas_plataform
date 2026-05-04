import { api } from './api-client';
import {
  ADMIN_EMAIL,
  SUPERVISOR_EMAIL,
  STAFF_EMAIL,
  SEED_PASSWORD,
} from './fixtures';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<Tokens> {
  const res = await api.post('/auth/login', { email, password });
  if (res.status !== 200) {
    throw new Error(
      `Login failed for ${email}: HTTP ${res.status} — ${JSON.stringify(res.data)}`,
    );
  }
  return res.data.data as Tokens;
}

export const loginAsAdmin = (): Promise<Tokens> =>
  login(ADMIN_EMAIL, SEED_PASSWORD);

export const loginAsSupervisor = (): Promise<Tokens> =>
  login(SUPERVISOR_EMAIL, SEED_PASSWORD);

export const loginAsStaff = (): Promise<Tokens> =>
  login(STAFF_EMAIL, SEED_PASSWORD);

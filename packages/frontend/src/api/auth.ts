import axios from 'axios';
import type { AuthTokens } from '../types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<{ data: LoginResponse }>('/api/v1/auth/login', { email, password });
  return data.data;
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  const { data } = await axios.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken: token });
  return data;
}

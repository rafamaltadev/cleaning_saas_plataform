import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from './fixtures';

/**
 * Creates an Axios instance pointing at the live Docker Compose backend.
 * validateStatus: () => true — never throw on HTTP error codes so tests can
 * assert the status code themselves.
 */
export function createClient(token?: string): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true,
    timeout: 15_000,
  });
}

/** Unauthenticated client for public endpoints */
export const api = createClient();

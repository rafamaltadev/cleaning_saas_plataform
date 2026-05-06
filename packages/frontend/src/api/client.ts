import axios from 'axios';
import { store } from '../store';
import { setAccessToken, logout } from '../store/slices/authSlice';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const REFRESH_TOKEN_KEY = 'refreshToken';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: import('axios').AxiosError) => {
    const originalRequest = error.config!;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
          '/api/v1/auth/refresh',
          { refreshToken: storedRefreshToken },
        );

        store.dispatch(setAccessToken(data.data.accessToken));
        localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);

        onRefreshed(data.data.accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];

        store.dispatch(logout());
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

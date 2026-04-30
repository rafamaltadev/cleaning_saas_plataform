import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { store } from '../store';
import { setCredentials, logout } from '../store/slices/authSlice';
import { REFRESH_TOKEN_KEY, apiClient } from '../api/client';

describe('API client 401 interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(logout());
  });

  it('triggers automatic token refresh and retries the original request on 401', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-refresh-token');
    store.dispatch(
      setCredentials({
        user: { id: 'u1', email: 'a@b.com', name: 'A', role: 'tenant_admin', tenantId: 't1' },
        accessToken: 'expired-token',
      }),
    );

    let clientCallCount = 0;
    server.use(
      http.get('/api/v1/clients', () => {
        clientCallCount++;
        if (clientCallCount === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 });
      }),
    );

    const response = await apiClient.get('/clients');

    expect(response.status).toBe(200);
    expect(clientCallCount).toBe(2);
    expect(store.getState().auth.accessToken).toBe('new-access-token');
  });

  it('clears tokens and dispatches logout when refresh fails', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'invalid-refresh-token');
    store.dispatch(
      setCredentials({
        user: { id: 'u1', email: 'a@b.com', name: 'A', role: 'tenant_admin', tenantId: 't1' },
        accessToken: 'expired-token',
      }),
    );

    // Spy on dispatch to observe logout() calls regardless of store instance
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    try {
      await apiClient.get('/clients');
    } catch {
      // Expected to reject after refresh failure
    }

    // Verify logout action was dispatched and localStorage was cleared
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/logout' }));
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();

    dispatchSpy.mockRestore();
  });
});

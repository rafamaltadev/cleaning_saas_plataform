/**
 * T16 — RBAC Enforcement Integration Tests
 *
 * Tool: axios + Jest
 * Rationale: Black-box HTTP tests against the live Docker Compose stack.
 * Verifies that each role (staff, supervisor, tenant_admin) can access exactly
 * the endpoints it is allowed, and receives 403 on all others.
 *
 * RBAC summary (from controller @Roles decorators):
 *   staff        → POST /availability only
 *   supervisor   → clients, quotes, bookings, services, pricing-rules,
 *                  billing, notifications, assignments, availability (GET)
 *   tenant_admin → all of the above + /users, /tenants/me
 *
 * Prerequisites: `docker compose up -d` with seed data applied.
 */

import { createClient } from '../support/api-client';
import {
  loginAsAdmin,
  loginAsSupervisor,
  loginAsStaff,
} from '../support/auth-helpers';

describe('RBAC Enforcement', () => {
  let adminApi: ReturnType<typeof createClient>;
  let supervisorApi: ReturnType<typeof createClient>;
  let staffApi: ReturnType<typeof createClient>;
  const anonApi = createClient(); // no token

  beforeAll(async () => {
    const [admin, supervisor, staff] = await Promise.all([
      loginAsAdmin(),
      loginAsSupervisor(),
      loginAsStaff(),
    ]);
    adminApi = createClient(admin.accessToken);
    supervisorApi = createClient(supervisor.accessToken);
    staffApi = createClient(staff.accessToken);
  });

  // ─── Unauthenticated ────────────────────────────────────────────────────────

  describe('Unauthenticated access', () => {
    it('GET /clients without token → 401', async () => {
      const res = await anonApi.get('/clients?page=1');
      expect(res.status).toBe(401);
    });

    it('POST /auth/login without body → 400 (not 401)', async () => {
      const res = await anonApi.post('/auth/login', {});
      expect(res.status).toBe(400);
    });
  });

  // ─── staff role ─────────────────────────────────────────────────────────────

  describe('staff role — forbidden endpoints return 403', () => {
    const forbiddenEndpoints = [
      ['GET', '/clients?page=1'],
      ['GET', '/quotes?page=1'],
      ['GET', '/bookings?page=1'],
      ['GET', '/users?page=1'],
      ['GET', '/notifications?limit=10'],
      ['GET', '/invoices?page=1'],
      ['GET', '/services?page=1'],
    ] as const;

    it.each(forbiddenEndpoints)(
      '%s %s → 403',
      async (method, path) => {
        const res =
          method === 'GET'
            ? await staffApi.get(path)
            : await staffApi.post(path, {});
        expect(res.status).toBe(403);
      },
    );

    it('POST /availability is allowed for staff (not 401 or 403)', async () => {
      const res = await staffApi.post('/availability', {
        available_date: '2027-06-01',
        start_time: '08:00',
        end_time: '16:00',
      });
      // 201 on success; 400/422 on validation failure (e.g. missing employee_id)
      // Either is acceptable — what matters is NOT 401 or 403
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  // ─── supervisor role ────────────────────────────────────────────────────────

  describe('supervisor role — allowed endpoints return 200', () => {
    it('GET /clients → 200', async () => {
      const res = await supervisorApi.get('/clients?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /quotes → 200', async () => {
      const res = await supervisorApi.get('/quotes?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /bookings → 200', async () => {
      const res = await supervisorApi.get('/bookings?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /services → 200', async () => {
      const res = await supervisorApi.get('/services?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /notifications → 200', async () => {
      const res = await supervisorApi.get('/notifications?limit=10');
      expect(res.status).toBe(200);
    });
  });

  describe('supervisor role — tenant_admin-only endpoints return 403', () => {
    it('GET /users → 403', async () => {
      const res = await supervisorApi.get('/users?page=1');
      expect(res.status).toBe(403);
    });

    it('GET /tenants/me → 403', async () => {
      const res = await supervisorApi.get('/tenants/me');
      expect(res.status).toBe(403);
    });

    it('PUT /tenants/me → 403', async () => {
      const res = await supervisorApi.put('/tenants/me', { name: 'Hack' });
      expect(res.status).toBe(403);
    });
  });

  // ─── tenant_admin role ──────────────────────────────────────────────────────

  describe('tenant_admin role — full access', () => {
    it('GET /clients → 200', async () => {
      const res = await adminApi.get('/clients?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /users → 200', async () => {
      const res = await adminApi.get('/users?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /tenants/me → 200', async () => {
      const res = await adminApi.get('/tenants/me');
      expect(res.status).toBe(200);
    });

    it('GET /quotes → 200', async () => {
      const res = await adminApi.get('/quotes?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /bookings → 200', async () => {
      const res = await adminApi.get('/bookings?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /invoices → 200', async () => {
      const res = await adminApi.get('/invoices?page=1');
      expect(res.status).toBe(200);
    });

    it('GET /notifications → 200', async () => {
      const res = await adminApi.get('/notifications?limit=10');
      expect(res.status).toBe(200);
    });
  });
});

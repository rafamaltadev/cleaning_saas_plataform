import { http, HttpResponse } from 'msw';

const BASE = '/api/v1';

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'admin@test.com' && body.password === 'password') {
      return HttpResponse.json({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'tenant_admin',
          tenantId: 'tenant-1',
        },
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as { refreshToken: string };
    if (body.refreshToken === 'valid-refresh-token') {
      return HttpResponse.json({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    }
    return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
  }),

  http.get(`${BASE}/clients`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    return HttpResponse.json({
      data: [
        { id: 'client-1', name: 'Alice Smith', email: 'alice@test.com', status: 'active', tenantId: 't1', createdAt: '', updatedAt: '' },
        { id: 'client-2', name: 'Bob Jones', email: 'bob@test.com', status: 'inactive', tenantId: 't1', createdAt: '', updatedAt: '' },
      ],
      total: 12,
      page,
      limit: 10,
    });
  }),

  http.get(`${BASE}/clients/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Alice Smith',
      email: 'alice@test.com',
      phone: '555-1234',
      status: 'active',
      tenantId: 't1',
      createdAt: '',
      updatedAt: '',
      addresses: [{ id: 'addr-1', street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001', country: 'US' }],
    });
  }),

  http.post(`${BASE}/clients`, () => {
    return HttpResponse.json(
      { id: 'client-new', name: 'New Client', email: 'new@test.com', status: 'active', tenantId: 't1', createdAt: '', updatedAt: '' },
      { status: 201 },
    );
  }),

  http.put(`${BASE}/clients/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Updated', email: 'updated@test.com', status: 'active', tenantId: 't1', createdAt: '', updatedAt: '' });
  }),

  http.get(`${BASE}/tenants/me`, () => {
    return HttpResponse.json({
      id: 'tenant-1',
      name: 'My Company',
      email: 'company@test.com',
      timezone: 'America/New_York',
      currency: 'USD',
    });
  }),

  http.put(`${BASE}/tenants/me`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'tenant-1', ...body });
  }),

  http.get(`${BASE}/services`, () => {
    return HttpResponse.json([
      { id: 'svc-1', name: 'Deep Clean', baseRate: 150, description: 'Full deep cleaning' },
    ]);
  }),

  http.get(`${BASE}/quotes`, () => {
    return HttpResponse.json([
      { id: 'q-1', clientId: 'c1', clientName: 'Alice', serviceName: 'Deep Clean', status: 'new_lead', createdAt: '' },
      { id: 'q-2', clientId: 'c2', clientName: 'Bob', serviceName: 'Regular Clean', status: 'contacted', createdAt: '' },
    ]);
  }),

  http.put(`${BASE}/quotes/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, status: 'contacted' });
  }),

  http.get(`${BASE}/bookings`, () => {
    return HttpResponse.json([
      { id: 'b-1', clientId: 'c3', clientName: 'Carol', serviceName: 'Window Clean', status: 'booking_confirmed', scheduledDate: '2026-05-01', createdAt: '' },
    ]);
  }),

  http.put(`${BASE}/bookings/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, status: 'completed' });
  }),
];

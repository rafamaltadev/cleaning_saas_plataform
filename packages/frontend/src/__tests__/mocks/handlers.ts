import { http, HttpResponse } from 'msw';

const BASE = '/api/v1';

// ── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_QUOTES_PAGINATED = [
  {
    id: 'q-draft-1', tenant_id: 't1', client_id: 'client-1', service_id: 'svc-1',
    pricing_rule_id: null, status: 'draft', estimated_total_cents: 15000,
    currency: 'USD', valid_until: '2026-05-08T00:00:00Z', manual_discount_percent: 0,
    created_by: 'u1', created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'q-sent-1', tenant_id: 't1', client_id: 'client-1', service_id: 'svc-1',
    pricing_rule_id: null, status: 'sent', estimated_total_cents: 20000,
    currency: 'USD', valid_until: '2026-05-08T00:00:00Z', manual_discount_percent: 0,
    created_by: 'u1', created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'q-accepted-1', tenant_id: 't1', client_id: 'client-1', service_id: 'svc-1',
    pricing_rule_id: null, status: 'accepted', estimated_total_cents: 25000,
    currency: 'USD', valid_until: '2026-05-08T00:00:00Z', manual_discount_percent: 0,
    created_by: 'u1', created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'q-expired-1', tenant_id: 't1', client_id: 'client-1', service_id: 'svc-1',
    pricing_rule_id: null, status: 'expired', estimated_total_cents: 12000,
    currency: 'USD', valid_until: '2026-04-01T00:00:00Z', manual_discount_percent: 0,
    created_by: 'u1', created_at: '2026-03-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'q-rejected-1', tenant_id: 't1', client_id: 'client-1', service_id: 'svc-1',
    pricing_rule_id: null, status: 'rejected', estimated_total_cents: 30000,
    currency: 'USD', valid_until: '2026-05-08T00:00:00Z', manual_discount_percent: 10,
    created_by: 'u1', created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-20T00:00:00Z',
  },
];

const MOCK_BOOKINGS_PAGINATED = [
  {
    id: 'b-confirmed-1', tenant_id: 't1', quote_id: 'q-accepted-1', client_id: 'client-1',
    service_id: 'svc-1', scheduled_start: '2026-05-10T09:00:00Z', scheduled_end: '2026-05-10T11:00:00Z',
    status: 'confirmed', assigned_team: 'Team A', idempotency_key: 'key-1',
    created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b-confirmed-2', tenant_id: 't1', quote_id: 'q-accepted-1', client_id: 'client-1',
    service_id: 'svc-1', scheduled_start: '2026-05-11T10:00:00Z', scheduled_end: '2026-05-11T12:00:00Z',
    status: 'confirmed', assigned_team: null, idempotency_key: 'key-2',
    created_at: '2026-04-02T00:00:00Z', updated_at: '2026-04-02T00:00:00Z',
  },
  {
    id: 'b-confirmed-3', tenant_id: 't1', quote_id: 'q-accepted-1', client_id: 'client-1',
    service_id: 'svc-1', scheduled_start: '2026-05-12T14:00:00Z', scheduled_end: '2026-05-12T16:00:00Z',
    status: 'confirmed', assigned_team: 'Team B', idempotency_key: 'key-3',
    created_at: '2026-04-03T00:00:00Z', updated_at: '2026-04-03T00:00:00Z',
  },
  {
    id: 'b-cancelled-1', tenant_id: 't1', quote_id: 'q-accepted-1', client_id: 'client-1',
    service_id: 'svc-1', scheduled_start: '2026-05-05T09:00:00Z', scheduled_end: '2026-05-05T11:00:00Z',
    status: 'cancelled', assigned_team: null, idempotency_key: 'key-4',
    created_at: '2026-03-20T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b-completed-1', tenant_id: 't1', quote_id: 'q-accepted-1', client_id: 'client-1',
    service_id: 'svc-1', scheduled_start: '2026-04-15T09:00:00Z', scheduled_end: '2026-04-15T11:00:00Z',
    status: 'completed', assigned_team: 'Team A', idempotency_key: 'key-5',
    created_at: '2026-03-10T00:00:00Z', updated_at: '2026-04-15T12:00:00Z',
  },
];

const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1', tenant_id: 't1', client_id: 'client-1', booking_id: 'b-confirmed-1', quote_id: null,
    type: 'email', template: 'booking_confirmed', status: 'sent', sent_at: '2026-04-01T00:05:00Z',
    payload: {}, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:05:00Z',
  },
  {
    id: 'n-2', tenant_id: 't1', client_id: 'client-1', booking_id: null, quote_id: 'q-sent-1',
    type: 'email', template: 'quote_sent', status: 'sent', sent_at: '2026-04-02T00:05:00Z',
    payload: {}, created_at: '2026-04-02T00:00:00Z', updated_at: '2026-04-02T00:05:00Z',
  },
  {
    id: 'n-3', tenant_id: 't1', client_id: 'client-1', booking_id: 'b-confirmed-2', quote_id: null,
    type: 'sms', template: 'booking_reminder', status: 'sent', sent_at: '2026-04-03T00:05:00Z',
    payload: {}, created_at: '2026-04-03T00:00:00Z', updated_at: '2026-04-03T00:05:00Z',
  },
  {
    id: 'n-4', tenant_id: 't1', client_id: null, booking_id: null, quote_id: null,
    type: 'email', template: 'system_alert', status: 'failed', sent_at: null,
    payload: {}, created_at: '2026-04-04T00:00:00Z', updated_at: '2026-04-04T00:05:00Z',
  },
  {
    id: 'n-5', tenant_id: 't1', client_id: 'client-1', booking_id: 'b-confirmed-3', quote_id: null,
    type: 'email', template: 'booking_confirmed', status: 'sent', sent_at: '2026-04-05T00:05:00Z',
    payload: {}, created_at: '2026-04-05T00:00:00Z', updated_at: '2026-04-05T00:05:00Z',
  },
];

// ── Handlers ─────────────────────────────────────────────────────────────────

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
      { id: 'svc-1', name: 'Deep Clean', baseRate: 150, base_rate_cents: 15000, unit: 'flat', description: 'Full deep cleaning' },
      { id: 'svc-2', name: 'Window Clean', baseRate: 5, base_rate_cents: 500, unit: 'sqm', description: 'Window cleaning per sqm' },
    ]);
  }),

  // Quotes — dual format: array for Kanban (no page param), paginated for T14 (page param present)
  http.get(`${BASE}/quotes`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const status = url.searchParams.get('status');

    if (page !== null) {
      const filtered = status
        ? MOCK_QUOTES_PAGINATED.filter((q) => q.status === status)
        : MOCK_QUOTES_PAGINATED;
      const pageNum = Number(page);
      const limit = Number(url.searchParams.get('limit') ?? 20);
      const start = (pageNum - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return HttpResponse.json({
        items,
        meta: { total: filtered.length, page: pageNum, limit, totalPages: Math.ceil(filtered.length / limit) || 1 },
      });
    }

    // Kanban array format
    return HttpResponse.json([
      { id: 'q-1', clientId: 'c1', clientName: 'Alice', serviceName: 'Deep Clean', status: 'new_lead', createdAt: '' },
      { id: 'q-2', clientId: 'c2', clientName: 'Bob', serviceName: 'Regular Clean', status: 'contacted', createdAt: '' },
    ]);
  }),

  http.get(`${BASE}/quotes/:id`, ({ params }) => {
    const found = MOCK_QUOTES_PAGINATED.find((q) => q.id === params.id);
    if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.post(`${BASE}/quotes`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 'q-new-1', tenant_id: 't1', client_id: body.client_id, service_id: body.service_id,
      pricing_rule_id: body.pricing_rule_id ?? null, status: 'draft',
      estimated_total_cents: 15000, currency: body.currency ?? 'USD',
      valid_until: body.valid_until, manual_discount_percent: body.manual_discount_percent ?? 0,
      created_by: 'u1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.post(`${BASE}/quotes/:id/send`, ({ params }) => {
    const found = MOCK_QUOTES_PAGINATED.find((q) => q.id === params.id);
    if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...found, status: 'sent' });
  }),

  http.put(`${BASE}/quotes/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, status: 'contacted' });
  }),

  // Bookings — dual format: array for Kanban (no page param), paginated for T14 (page param present)
  http.get(`${BASE}/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const status = url.searchParams.get('status');

    if (page !== null) {
      const filtered = status
        ? MOCK_BOOKINGS_PAGINATED.filter((b) => b.status === status)
        : MOCK_BOOKINGS_PAGINATED;
      const pageNum = Number(page);
      const limit = Number(url.searchParams.get('limit') ?? 20);
      const start = (pageNum - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return HttpResponse.json({
        items,
        meta: { total: filtered.length, page: pageNum, limit, totalPages: Math.ceil(filtered.length / limit) || 1 },
      });
    }

    // Kanban array format
    return HttpResponse.json([
      { id: 'b-1', clientId: 'c3', clientName: 'Carol', serviceName: 'Window Clean', status: 'booking_confirmed', scheduledDate: '2026-05-01', createdAt: '' },
    ]);
  }),

  http.get(`${BASE}/bookings/:id`, ({ params }) => {
    const found = MOCK_BOOKINGS_PAGINATED.find((b) => b.id === params.id);
    if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.post(`${BASE}/bookings`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 'b-new-1', tenant_id: 't1', quote_id: body.quote_id, client_id: body.client_id,
      service_id: body.service_id, scheduled_start: body.scheduled_start, scheduled_end: body.scheduled_end,
      status: 'confirmed', assigned_team: body.assigned_team ?? null,
      idempotency_key: body.idempotency_key as string,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.post(`${BASE}/bookings/:id/complete`, ({ params }) => {
    const found = MOCK_BOOKINGS_PAGINATED.find((b) => b.id === params.id);
    if (!found) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...found, status: 'completed' });
  }),

  http.put(`${BASE}/bookings/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id, status: 'completed' });
  }),

  http.get(`${BASE}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    return HttpResponse.json(MOCK_NOTIFICATIONS.slice(0, limit));
  }),

  http.get(`${BASE}/feature-flags`, () => {
    return HttpResponse.json({ notifications_enabled: true });
  }),

  http.get(`${BASE}/pricing-rules`, () => {
    return HttpResponse.json({
      items: [
        {
          id: 'rule-1', tenant_id: 't1', service_id: 'svc-1', min_area: null, max_area: null,
          frequency: 'weekly', discount_percent: 10, price_multiplier: 1.0,
          created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  }),
];

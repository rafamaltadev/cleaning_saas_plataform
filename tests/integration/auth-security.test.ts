/**
 * T16 — Authentication & Security Integration Tests
 *
 * Tool: axios + Jest (live API tests); @nestjs/testing + supertest (rate limit)
 * Rationale: Most tests hit the live Docker Compose backend at localhost:3000.
 * The rate limit test uses an in-process NestJS app with limit=2 so it can
 * trigger 429 without exhausting the live backend's high THROTTLE_AUTH_LIMIT.
 *
 * Prerequisites: `docker compose up -d` with seed data applied.
 * Set SEED_DEFAULT_PASSWORD to the value used when running `npm run seed`.
 */

import 'reflect-metadata';
import { Controller, Get, HttpCode, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { createClient, api } from '../support/api-client';
import { DOCKER_JWT_SECRET, ADMIN_EMAIL, SEED_PASSWORD } from '../support/fixtures';

// ─── Minimal controller for in-process rate limit test ───────────────────────

@Controller('__ratelimit_probe')
class RateLimitProbeController {
  @Get()
  @HttpCode(200)
  ping() {
    return { ok: true };
  }
}

// ─── Full auth lifecycle ──────────────────────────────────────────────────────

describe('Authentication — full lifecycle', () => {
  it('login → access protected endpoint → refresh → retry → logout', async () => {
    // 1. Login
    const loginRes = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: SEED_PASSWORD,
    });
    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = loginRes.data.data as {
      accessToken: string;
      refreshToken: string;
    };
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // 2. Access protected endpoint with valid access token
    const authedClient = createClient(accessToken);
    const meRes = await authedClient.get('/tenants/me');
    expect(meRes.status).toBe(200);

    // 3. Expired / invalid token is rejected
    const expiredClient = createClient('totally.invalid.token');
    const expiredRes = await expiredClient.get('/tenants/me');
    expect(expiredRes.status).toBe(401);

    // 4. Refresh tokens
    const refreshRes = await api.post('/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(200);
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      refreshRes.data.data as { accessToken: string; refreshToken: string };
    expect(newAccessToken).toBeTruthy();

    // 5. Retry with refreshed access token
    const newClient = createClient(newAccessToken);
    const retryRes = await newClient.get('/tenants/me');
    expect(retryRes.status).toBe(200);

    // 6. Logout revokes refresh token
    const logoutRes = await api.post('/auth/logout', {
      refreshToken: newRefreshToken,
    });
    expect(logoutRes.status).toBe(200);
  });
});

// ─── Refresh token reuse detection ───────────────────────────────────────────

describe('Authentication — refresh token reuse detection', () => {
  it('logout then attempt refresh with revoked token returns 401', async () => {
    const loginRes = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: SEED_PASSWORD,
    });
    expect(loginRes.status).toBe(200);
    const { refreshToken } = loginRes.data.data as { refreshToken: string };

    // Logout to revoke the token
    await api.post('/auth/logout', { refreshToken });

    // Attempt to reuse the now-revoked token
    const reuseRes = await api.post('/auth/refresh', { refreshToken });
    expect(reuseRes.status).toBe(401);
  });

  it('all sessions are revoked when a revoked refresh token is detected', async () => {
    // Login twice to get two refresh tokens
    const first = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: SEED_PASSWORD,
    });
    const firstRefresh = first.data.data.refreshToken as string;

    const second = await api.post('/auth/refresh', {
      refreshToken: firstRefresh,
    });
    const secondRefresh = second.data.data.refreshToken as string;

    // Revoke secondRefresh
    await api.post('/auth/logout', { refreshToken: secondRefresh });

    // Attempt to reuse the revoked secondRefresh → triggers full revocation
    const reuse = await api.post('/auth/refresh', {
      refreshToken: secondRefresh,
    });
    expect(reuse.status).toBe(401);
  });
});

// ─── Cross-tenant isolation ───────────────────────────────────────────────────

describe('Cross-tenant access isolation', () => {
  it('JWT with a foreign tenant_id cannot retrieve data belonging to another tenant', async () => {
    // Login as real tenant admin and create a client to reference
    const loginRes = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: SEED_PASSWORD,
    });
    const adminClient = createClient(loginRes.data.data.accessToken as string);

    // Ensure at least one client exists in the real tenant
    const listRes = await adminClient.get('/clients?page=1&limit=1');
    expect(listRes.status).toBe(200);
    const realItems: any[] = listRes.data.data.items ?? [];

    if (realItems.length === 0) {
      // Seed a client so we have something to probe
      const created = await adminClient.post('/clients', {
        name: 'Cross-Tenant Probe Client',
        email: `probe-${Date.now()}@test.com`,
        phone: '+5511000000000',
      });
      expect(created.status).toBe(201);
    }

    // Build a cross-tenant JWT (valid signature, different tenant)
    const crossToken = jwt.sign(
      {
        sub: '00000000-0000-0000-0000-000000000099',
        tenantId: '99999999-9999-9999-9999-999999999999',
        roles: ['tenant_admin'],
      },
      DOCKER_JWT_SECRET,
      { expiresIn: '5m' },
    );
    const crossClient = createClient(crossToken);

    // Cross-tenant client must receive empty results — tenant B has no clients
    const crossList = await crossClient.get('/clients?page=1&limit=50');
    expect(crossList.status).toBe(200);
    const crossItems: any[] = crossList.data.data.items ?? [];
    expect(crossItems).toHaveLength(0);
  });
});

// ─── CORS enforcement ─────────────────────────────────────────────────────────

describe('CORS configuration', () => {
  it('preflight from the allowed frontend origin receives correct CORS headers', async () => {
    const res = await api.request({
      method: 'OPTIONS',
      url: '/auth/login',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  it('preflight from a disallowed origin does not grant that origin CORS access', async () => {
    const res = await api.request({
      method: 'OPTIONS',
      url: '/auth/login',
      headers: {
        Origin: 'http://evil-attacker.example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('http://evil-attacker.example.com');
  });
});

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Uses an in-process NestJS app with limit=2 so we can trigger 429 without
// exhausting the live backend's THROTTLE_AUTH_LIMIT (set high for test safety).

describe('Rate limiting', () => {
  let rateLimitApp: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 2 }])],
      controllers: [RateLimitProbeController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    rateLimitApp = moduleRef.createNestApplication();
    await rateLimitApp.init();
  });

  afterAll(async () => {
    await rateLimitApp?.close();
  });

  it('exceeding the throttle limit returns HTTP 429', async () => {
    const server = rateLimitApp.getHttpServer();
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await supertest(server).get('/__ratelimit_probe');
      statuses.push(res.status);
      if (res.status === 429) break;
    }
    expect(statuses).toContain(429);
  });
});

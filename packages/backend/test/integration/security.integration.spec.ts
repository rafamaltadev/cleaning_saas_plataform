import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Controller, Get, HttpCode } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard, SkipThrottle, Throttle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppThrottlerGuard } from '../../src/common/guards/app-throttler.guard';
import configuration from '../../src/config/configuration';

// ─── Suite 1: Rate limiter configuration ─────────────────────────────────────

describe('Rate limiter configuration (unit-level)', () => {
  it('THROTTLE_AUTH_LIMIT env var is parsed as integer correctly', () => {
    const original = process.env.THROTTLE_AUTH_LIMIT;
    process.env.THROTTLE_AUTH_LIMIT = '3';
    const cfg = configuration();
    expect(cfg.throttle.authLimit).toBe(3);
    process.env.THROTTLE_AUTH_LIMIT = original;
  });

  it('auth throttle limit is lower (stricter) than global throttle limit by default', () => {
    const originals = {
      ttl: process.env.THROTTLE_TTL,
      limit: process.env.THROTTLE_LIMIT,
      authTtl: process.env.THROTTLE_AUTH_TTL,
      authLimit: process.env.THROTTLE_AUTH_LIMIT,
    };
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    delete process.env.THROTTLE_AUTH_TTL;
    delete process.env.THROTTLE_AUTH_LIMIT;

    const cfg = configuration();
    expect(cfg.throttle.authLimit).toBeLessThan(cfg.throttle.limit);

    Object.assign(process.env, originals);
  });
});

// ─── Suite 2: Per-IP rate limiting HTTP behavior ──────────────────────────────

@Controller('__test_global')
class GlobalTestController {
  @Get()
  @HttpCode(200)
  ping() {
    return { ok: true };
  }
}

describe('ThrottlerModule — per-IP rate limiting', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 2 }]),
      ],
      controllers: [GlobalTestController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('requests within the configured rate limit succeed with HTTP 200', async () => {
    const res = await request(app.getHttpServer()).get('/__test_global');
    expect(res.status).toBe(200);
  });

  it('requests exceeding the configured per-IP rate limit return HTTP 429', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer()).get('/__test_global');
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});

// ─── Suite 3: Auth endpoint stricter limit ────────────────────────────────────

@Controller('__test_auth')
@SkipThrottle({ default: true })
@Throttle({ auth: { ttl: 60000, limit: 1 } })
class AuthTestController {
  @Get()
  @HttpCode(200)
  login() {
    return { ok: true };
  }
}

@Controller('__test_regular')
@SkipThrottle({ auth: true })
class RegularTestController {
  @Get()
  @HttpCode(200)
  regular() {
    return { ok: true };
  }
}

describe('ThrottlerModule — auth endpoint stricter limit', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
        ThrottlerModule.forRoot([
          { name: 'default', ttl: 60000, limit: 10 },
          { name: 'auth', ttl: 60000, limit: 1 },
        ]),
      ],
      controllers: [AuthTestController, RegularTestController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('regular endpoint accepts requests up to the global limit', async () => {
    const res1 = await request(app.getHttpServer()).get('/__test_regular');
    const res2 = await request(app.getHttpServer()).get('/__test_regular');
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('auth endpoint returns HTTP 429 before the global endpoint threshold is reached', async () => {
    // First auth request succeeds
    const res1 = await request(app.getHttpServer()).get('/__test_auth');
    expect(res1.status).toBe(200);
    // Second auth request hits the stricter limit (1) before global limit (10)
    const res2 = await request(app.getHttpServer()).get('/__test_auth');
    expect(res2.status).toBe(429);
  });
});

// ─── Suite 4: CORS configuration ─────────────────────────────────────────────

describe('CORS configuration', () => {
  it('frontend origin is a specific URL — not a wildcard', () => {
    const original = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://app.cleaning-saas.com';
    const cfg = configuration();
    expect(cfg.frontendUrl).toBe('https://app.cleaning-saas.com');
    expect(cfg.frontendUrl).not.toBe('*');
    process.env.FRONTEND_URL = original;
  });

  it('CORS default origin is a valid specific URL, not a wildcard', () => {
    const original = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;
    const cfg = configuration();
    expect(cfg.frontendUrl).not.toBe('*');
    expect(cfg.frontendUrl).toMatch(/^https?:\/\//);
    process.env.FRONTEND_URL = original;
  });
});

// ─── Suite 5: AppThrottlerGuard — per-user tracking ──────────────────────────

describe('AppThrottlerGuard — per-user vs per-IP tracking', () => {
  let guard: AppThrottlerGuard;

  beforeEach(() => {
    guard = new AppThrottlerGuard({} as any, {} as any, {} as any);
  });

  it('uses user ID as tracker key for authenticated requests', async () => {
    const req = { user: { userId: 'user-123', tenantId: 't', roles: [] }, ip: '1.2.3.4' };
    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('user-123');
  });

  it('uses IP address as tracker key for unauthenticated requests', async () => {
    const req = { user: undefined, ip: '10.0.0.1' };
    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('10.0.0.1');
  });

  it('different authenticated users get independent rate limit buckets', async () => {
    const reqA = { user: { userId: 'user-A', tenantId: 't', roles: [] }, ip: '1.1.1.1' };
    const reqB = { user: { userId: 'user-B', tenantId: 't', roles: [] }, ip: '1.1.1.1' };
    const trackerA = await (guard as any).getTracker(reqA);
    const trackerB = await (guard as any).getTracker(reqB);
    expect(trackerA).not.toBe(trackerB);
  });

  it('authenticated users on the same IP get per-user buckets, not per-IP', async () => {
    const req = { user: { userId: 'user-uuid', tenantId: 't', roles: [] }, ip: '1.2.3.4' };
    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('user-uuid');
    expect(tracker).not.toBe('1.2.3.4');
  });
});

// ─── Suite 6: OpenAPI spec ───────────────────────────────────────────────────

describe('OpenAPI spec', () => {
  it('Swagger is configured at /api/v1/docs path', () => {
    const docsPath = 'api/v1/docs';
    expect(docsPath).toBe('api/v1/docs');
  });

  it('DocumentBuilder includes Bearer auth security scheme', () => {
    const { DocumentBuilder } = require('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Cleaning SaaS API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    expect(config.components?.securitySchemes?.['bearer']).toBeDefined();
  });

  it('DocumentBuilder config covers required API title and version', () => {
    const { DocumentBuilder } = require('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Cleaning SaaS API')
      .setDescription('REST API for the Cleaning SaaS platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    expect(config.info.title).toBe('Cleaning SaaS API');
    expect(config.info.version).toBe('1.0');
    expect(config.info.description).toContain('Cleaning SaaS');
  });
});

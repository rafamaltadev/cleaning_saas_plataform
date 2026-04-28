import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';

import { TenantController } from '../../src/modules/tenant/interfaces/tenant.controller';
import { UsersController } from '../../src/modules/users/interfaces/users.controller';
import { TenantService } from '../../src/modules/tenant/application/tenant.service';
import { UsersService } from '../../src/modules/users/application/users.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { AuthUserMiddleware } from '../../src/common/middleware/auth-user.middleware';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

const TEST_JWT_SECRET = 'integration-test-access-secret';
const TEST_REFRESH_SECRET = 'integration-test-refresh-secret';

const testConfig = () => ({
  jwt: {
    secret: TEST_JWT_SECRET,
    refreshSecret: TEST_REFRESH_SECRET,
    accessExpiration: '15m',
    refreshExpiration: '30d',
  },
  frontendUrl: 'http://localhost:5173',
  port: 3000,
  nodeEnv: 'test',
});

const TENANT_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const TENANT_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const ACTOR_ID = 'actor-uuid-0000-0000-0000-000000000001';

function makeTenantDto(overrides: object = {}) {
  return {
    id: TENANT_A,
    name: 'Tenant A',
    subscription_plan: 'basic',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeUserDto(overrides: object = {}) {
  return {
    id: 'user-uuid',
    tenant_id: TENANT_A,
    email: 'user@tenanta.com',
    roles: ['tenant_admin'],
    first_name: 'John',
    last_name: 'Doe',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

async function buildApp(
  tenantServiceMock: Partial<TenantService>,
  usersServiceMock: Partial<UsersService>,
): Promise<{ app: INestApplication; jwtService: JwtService }> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [testConfig],
      }),
      JwtModule.register({}),
      ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    ],
    controllers: [TenantController, UsersController],
    providers: [
      AuthUserMiddleware,
      JwtAuthGuard,
      RolesGuard,
      { provide: TenantService, useValue: tenantServiceMock },
      { provide: UsersService, useValue: usersServiceMock },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  }).compile();

  const jwtService = moduleRef.get<JwtService>(JwtService);

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const middleware = moduleRef.get<AuthUserMiddleware>(AuthUserMiddleware);
  app.use(middleware.use.bind(middleware));

  await app.init();
  return { app, jwtService };
}

describe('Tenant & Users Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tenantServiceMock: jest.Mocked<Pick<TenantService, 'getById' | 'update'>>;
  let usersServiceMock: jest.Mocked<
    Pick<UsersService, 'findAll' | 'create' | 'update'>
  >;

  beforeAll(async () => {
    tenantServiceMock = {
      getById: jest.fn(),
      update: jest.fn(),
    };
    usersServiceMock = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    ({ app, jwtService } = await buildApp(tenantServiceMock, usersServiceMock));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function adminToken(tenantId: string = TENANT_A): string {
    return jwtService.sign(
      { sub: ACTOR_ID, tenantId, roles: ['tenant_admin'] },
      { secret: TEST_JWT_SECRET, expiresIn: '15m' },
    );
  }

  function staffToken(tenantId: string = TENANT_A): string {
    return jwtService.sign(
      { sub: ACTOR_ID, tenantId, roles: ['staff'] },
      { secret: TEST_JWT_SECRET, expiresIn: '15m' },
    );
  }

  function supervisorToken(tenantId: string = TENANT_A): string {
    return jwtService.sign(
      { sub: ACTOR_ID, tenantId, roles: ['supervisor'] },
      { secret: TEST_JWT_SECRET, expiresIn: '15m' },
    );
  }

  // ─── GET /api/v1/tenants/me ──────────────────────────────────────────────────

  describe('GET /api/v1/tenants/me', () => {
    it('returns tenant data for tenant_admin', async () => {
      tenantServiceMock.getById.mockResolvedValue(makeTenantDto() as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: TENANT_A,
        name: 'Tenant A',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
      });
      expect(tenantServiceMock.getById).toHaveBeenCalledWith(TENANT_A);
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${staffToken()}`)
        .expect(403);
    });

    it('returns 403 for supervisor role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/me')
        .expect(401);
    });

    it('does not expose deleted_at in response', async () => {
      tenantServiceMock.getById.mockResolvedValue(makeTenantDto() as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      expect(res.body.data).not.toHaveProperty('deleted_at');
    });
  });

  // ─── PUT /api/v1/tenants/me ──────────────────────────────────────────────────

  describe('PUT /api/v1/tenants/me', () => {
    it('updates and returns tenant data for tenant_admin', async () => {
      const updated = makeTenantDto({ timezone: 'America/New_York' });
      tenantServiceMock.update.mockResolvedValue(updated as any);

      const res = await request(app.getHttpServer())
        .put('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ timezone: 'America/New_York' })
        .expect(200);

      expect(res.body.data.timezone).toBe('America/New_York');
      expect(tenantServiceMock.update).toHaveBeenCalledWith(
        TENANT_A,
        { timezone: 'America/New_York' },
      );
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send({ timezone: 'UTC' })
        .expect(403);
    });

    it('rejects invalid currency value with 400', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/tenants/me')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ currency: 'EUR' })
        .expect(400);
    });
  });

  // ─── GET /api/v1/users ───────────────────────────────────────────────────────

  describe('GET /api/v1/users', () => {
    it('returns paginated users for tenant_admin', async () => {
      const paginatedResult = {
        items: [makeUserDto()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      usersServiceMock.findAll.mockResolvedValue(paginatedResult as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken()}`)
        .expect(403);
    });

    it('pagination meta contains correct total, page, limit, totalPages', async () => {
      usersServiceMock.findAll.mockResolvedValue({
        items: [],
        meta: { total: 55, page: 2, limit: 10, totalPages: 6 },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      expect(res.body.data.meta).toEqual({
        total: 55,
        page: 2,
        limit: 10,
        totalPages: 6,
      });
    });

    it('soft-deleted users do not appear (service returns filtered list)', async () => {
      usersServiceMock.findAll.mockResolvedValue({
        items: [makeUserDto({ id: 'active-user' })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      const ids = res.body.data.items.map((u: any) => u.id);
      expect(ids).not.toContain('soft-deleted-user');
      expect(ids).toContain('active-user');
    });

    it('scopes query to the requesting user tenant (cross-tenant isolation)', async () => {
      usersServiceMock.findAll.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      } as any);

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken(TENANT_B)}`)
        .expect(200);

      expect(usersServiceMock.findAll).toHaveBeenCalledWith(
        TENANT_B,
        expect.any(Object),
      );
    });
  });

  // ─── POST /api/v1/users ──────────────────────────────────────────────────────

  describe('POST /api/v1/users', () => {
    const validPayload = {
      email: 'newuser@tenanta.com',
      password: 'securepassword',
      first_name: 'New',
      last_name: 'User',
      roles: ['staff'],
    };

    it('creates a user scoped to the requesting tenant', async () => {
      const created = makeUserDto({
        email: 'newuser@tenanta.com',
        tenant_id: TENANT_A,
      });
      usersServiceMock.create.mockResolvedValue(created as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data.tenant_id).toBe(TENANT_A);
      expect(usersServiceMock.create).toHaveBeenCalledWith(
        TENANT_A,
        ACTOR_ID,
        expect.objectContaining({ email: 'newuser@tenanta.com' }),
      );
    });

    it('response does not contain password_hash', async () => {
      usersServiceMock.create.mockResolvedValue(makeUserDto() as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('response does not contain deleted_at', async () => {
      usersServiceMock.create.mockResolvedValue(makeUserDto() as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ email: 'incomplete@test.com' })
        .expect(400);
    });

    it('returns 400 for invalid role value', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ ...validPayload, roles: ['superadmin'] })
        .expect(400);
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send(validPayload)
        .expect(403);
    });

    it('prevents mass assignment — extra fields are stripped', async () => {
      usersServiceMock.create.mockResolvedValue(makeUserDto() as any);

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ ...validPayload, tenant_id: TENANT_B })
        .expect(400);
    });
  });

  // ─── PUT /api/v1/users/:id ───────────────────────────────────────────────────

  describe('PUT /api/v1/users/:id', () => {
    it('updates user and returns response without sensitive fields', async () => {
      const updated = makeUserDto({ first_name: 'Updated', roles: ['supervisor'] });
      usersServiceMock.update.mockResolvedValue(updated as any);

      const res = await request(app.getHttpServer())
        .put('/api/v1/users/user-uuid')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ first_name: 'Updated', roles: ['supervisor'] })
        .expect(200);

      expect(res.body.data.first_name).toBe('Updated');
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('scopes the update to the requesting tenant (cross-tenant isolation)', async () => {
      usersServiceMock.update.mockResolvedValue(makeUserDto() as any);

      await request(app.getHttpServer())
        .put('/api/v1/users/user-uuid')
        .set('Authorization', `Bearer ${adminToken(TENANT_B)}`)
        .send({ first_name: 'Hacker' })
        .expect(200);

      expect(usersServiceMock.update).toHaveBeenCalledWith(
        TENANT_B,
        ACTOR_ID,
        'user-uuid',
        expect.any(Object),
      );
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/user-uuid')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send({ first_name: 'X' })
        .expect(403);
    });

    it('returns 400 for invalid role in update', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/user-uuid')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ roles: ['superuser'] })
        .expect(400);
    });
  });
});

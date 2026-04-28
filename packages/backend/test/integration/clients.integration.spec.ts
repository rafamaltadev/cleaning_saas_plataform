import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';

import { ClientsController } from '../../src/modules/clients/interfaces/clients.controller';
import { AddressesController } from '../../src/modules/clients/interfaces/addresses.controller';
import { ClientsService } from '../../src/modules/clients/application/clients.service';
import { AddressesService } from '../../src/modules/clients/application/addresses.service';
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

function makeClientDto(overrides: object = {}) {
  return {
    id: 'client-uuid',
    tenant_id: TENANT_A,
    name: 'Test Client',
    email: 'client@tenanta.com',
    phone: '+5511999999999',
    address_id: null,
    preferred_language: 'pt-BR',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeAddressDto(overrides: object = {}) {
  return {
    id: 'addr-uuid',
    tenant_id: TENANT_A,
    street: '123 Main St',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01310-100',
    country: 'Brazil',
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

async function buildApp(
  clientsServiceMock: Partial<ClientsService>,
  addressesServiceMock: Partial<AddressesService>,
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
    controllers: [ClientsController, AddressesController],
    providers: [
      AuthUserMiddleware,
      JwtAuthGuard,
      RolesGuard,
      { provide: ClientsService, useValue: clientsServiceMock },
      { provide: AddressesService, useValue: addressesServiceMock },
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

describe('Clients & Addresses Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientsServiceMock: jest.Mocked<Pick<ClientsService, 'findAll' | 'create' | 'update'>>;
  let addressesServiceMock: jest.Mocked<Pick<AddressesService, 'create' | 'update'>>;

  beforeAll(async () => {
    clientsServiceMock = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    addressesServiceMock = {
      create: jest.fn(),
      update: jest.fn(),
    };

    ({ app, jwtService } = await buildApp(clientsServiceMock, addressesServiceMock));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function supervisorToken(tenantId: string = TENANT_A): string {
    return jwtService.sign(
      { sub: ACTOR_ID, tenantId, roles: ['supervisor'] },
      { secret: TEST_JWT_SECRET, expiresIn: '15m' },
    );
  }

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

  // ─── GET /api/v1/clients ─────────────────────────────────────────────────────

  describe('GET /api/v1/clients', () => {
    it('returns paginated clients for supervisor role', async () => {
      const paginatedResult = {
        items: [makeClientDto()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      clientsServiceMock.findAll.mockResolvedValue(paginatedResult as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('does not return clients belonging to a different tenant', async () => {
      clientsServiceMock.findAll.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      } as any);

      await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken(TENANT_B)}`)
        .expect(200);

      expect(clientsServiceMock.findAll).toHaveBeenCalledWith(
        TENANT_B,
        expect.any(Object),
      );
    });

    it('does not return soft-deleted clients (service returns filtered list)', async () => {
      clientsServiceMock.findAll.mockResolvedValue({
        items: [makeClientDto({ id: 'active-client' })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .expect(200);

      const ids = res.body.data.items.map((c: any) => c.id);
      expect(ids).not.toContain('soft-deleted-client');
      expect(ids).toContain('active-client');
    });

    it('pagination meta (total, page, limit, totalPages) is accurate', async () => {
      clientsServiceMock.findAll.mockResolvedValue({
        items: [],
        meta: { total: 55, page: 2, limit: 10, totalPages: 6 },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients?page=2&limit=10')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .expect(200);

      expect(res.body.data.meta).toEqual({
        total: 55,
        page: 2,
        limit: 10,
        totalPages: 6,
      });
    });

    it('deleted_at is never present in client response body', async () => {
      clientsServiceMock.findAll.mockResolvedValue({
        items: [makeClientDto()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .expect(200);

      expect(res.body.data.items[0]).not.toHaveProperty('deleted_at');
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${staffToken()}`)
        .expect(403);
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/clients')
        .expect(401);
    });

    it('tenant_admin can also access clients', async () => {
      clientsServiceMock.findAll.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      } as any);

      await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);
    });
  });

  // ─── POST /api/v1/clients ────────────────────────────────────────────────────

  describe('POST /api/v1/clients', () => {
    const validPayload = {
      name: 'New Client',
      email: 'newclient@tenanta.com',
      phone: '+5511999999999',
    };

    it('creates a client scoped to the requesting user tenant_id', async () => {
      const created = makeClientDto({ email: 'newclient@tenanta.com', tenant_id: TENANT_A });
      clientsServiceMock.create.mockResolvedValue(created as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data.tenant_id).toBe(TENANT_A);
      expect(clientsServiceMock.create).toHaveBeenCalledWith(
        TENANT_A,
        ACTOR_ID,
        expect.objectContaining({ email: 'newclient@tenanta.com' }),
      );
    });

    it('deleted_at is never present in POST client response body', async () => {
      clientsServiceMock.create.mockResolvedValue(makeClientDto() as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send(validPayload)
        .expect(403);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ email: 'incomplete@test.com' })
        .expect(400);
    });

    it('returns 400 for invalid preferred_language value', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ ...validPayload, preferred_language: 'fr' })
        .expect(400);
    });

    it('prevents mass assignment — extra fields are stripped', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ ...validPayload, tenant_id: TENANT_B })
        .expect(400);
    });
  });

  // ─── PUT /api/v1/clients/:id ─────────────────────────────────────────────────

  describe('PUT /api/v1/clients/:id', () => {
    it('updates client and returns response without deleted_at', async () => {
      const updated = makeClientDto({ name: 'Updated Client' });
      clientsServiceMock.update.mockResolvedValue(updated as any);

      const res = await request(app.getHttpServer())
        .put('/api/v1/clients/client-uuid')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ name: 'Updated Client' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Client');
      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('returns 403 when the client belongs to a different tenant', async () => {
      clientsServiceMock.update.mockRejectedValue(
        new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        }),
      );

      await request(app.getHttpServer())
        .put('/api/v1/clients/client-uuid')
        .set('Authorization', `Bearer ${supervisorToken(TENANT_A)}`)
        .send({ name: 'Hacker' })
        .expect(403);
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/clients/client-uuid')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send({ name: 'X' })
        .expect(403);
    });

    it('scopes the update to the requesting tenant', async () => {
      clientsServiceMock.update.mockResolvedValue(makeClientDto() as any);

      await request(app.getHttpServer())
        .put('/api/v1/clients/client-uuid')
        .set('Authorization', `Bearer ${supervisorToken(TENANT_B)}`)
        .send({ name: 'Update' })
        .expect(200);

      expect(clientsServiceMock.update).toHaveBeenCalledWith(
        TENANT_B,
        ACTOR_ID,
        'client-uuid',
        expect.any(Object),
      );
    });
  });

  // ─── POST /api/v1/addresses ──────────────────────────────────────────────────

  describe('POST /api/v1/addresses', () => {
    const validPayload = {
      street: '123 Main St',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01310-100',
      country: 'Brazil',
    };

    it('creates an address scoped to the requesting user tenant_id', async () => {
      const created = makeAddressDto({ tenant_id: TENANT_A });
      addressesServiceMock.create.mockResolvedValue(created as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data.tenant_id).toBe(TENANT_A);
      expect(addressesServiceMock.create).toHaveBeenCalledWith(
        TENANT_A,
        ACTOR_ID,
        expect.objectContaining({ street: '123 Main St' }),
      );
    });

    it('deleted_at is never present in POST address response body', async () => {
      addressesServiceMock.create.mockResolvedValue(makeAddressDto() as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send(validPayload)
        .expect(403);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ street: 'Only street' })
        .expect(400);
    });

    it('prevents mass assignment — extra fields are stripped', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ ...validPayload, tenant_id: TENANT_B })
        .expect(400);
    });
  });

  // ─── PUT /api/v1/addresses/:id ───────────────────────────────────────────────

  describe('PUT /api/v1/addresses/:id', () => {
    it('updates address and returns response without deleted_at', async () => {
      const updated = makeAddressDto({ street: 'Updated St' });
      addressesServiceMock.update.mockResolvedValue(updated as any);

      const res = await request(app.getHttpServer())
        .put('/api/v1/addresses/addr-uuid')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ street: 'Updated St' })
        .expect(200);

      expect(res.body.data.street).toBe('Updated St');
      expect(res.body.data).not.toHaveProperty('deleted_at');
    });

    it('returns 404 when address does not exist', async () => {
      addressesServiceMock.update.mockRejectedValue(
        new NotFoundException({
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found',
        }),
      );

      await request(app.getHttpServer())
        .put('/api/v1/addresses/missing-uuid')
        .set('Authorization', `Bearer ${supervisorToken()}`)
        .send({ street: 'X' })
        .expect(404);
    });

    it('returns 403 for staff role', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/addresses/addr-uuid')
        .set('Authorization', `Bearer ${staffToken()}`)
        .send({ street: 'X' })
        .expect(403);
    });

    it('scopes the update to the requesting tenant', async () => {
      addressesServiceMock.update.mockResolvedValue(makeAddressDto() as any);

      await request(app.getHttpServer())
        .put('/api/v1/addresses/addr-uuid')
        .set('Authorization', `Bearer ${supervisorToken(TENANT_B)}`)
        .send({ street: 'Update' })
        .expect(200);

      expect(addressesServiceMock.update).toHaveBeenCalledWith(
        TENANT_B,
        ACTOR_ID,
        'addr-uuid',
        expect.any(Object),
      );
    });
  });
});

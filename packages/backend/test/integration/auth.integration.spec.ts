import 'reflect-metadata';
import { Controller, Get, INestApplication, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AuthController } from '../../src/modules/auth/interfaces/auth.controller';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { AuthUserMiddleware } from '../../src/common/middleware/auth-user.middleware';
import { User } from '../../src/modules/auth/domain/user.entity';
import { RefreshToken } from '../../src/modules/auth/domain/refresh-token.entity';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { AuthUser } from '../../src/common/interfaces/auth-user.interface';

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

@Controller('test')
class TestProtectedController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtected(): { ok: boolean } {
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user?: AuthUser }): AuthUser | undefined {
    return req.user;
  }
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid',
    tenant_id: 'tenant-uuid',
    email: 'user@example.com',
    password_hash: '',
    roles: ['admin'],
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

async function buildTestApp(
  userRepo: object,
  tokenRepo: object,
): Promise<{ app: INestApplication; jwtService: JwtService }> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [testConfig] }),
      JwtModule.register({}),
      ThrottlerModule.forRoot([
        { name: 'default', ttl: 60000, limit: 100 },
        { name: 'auth', ttl: 60000, limit: 2 },
      ]),
    ],
    controllers: [AuthController, TestProtectedController],
    providers: [
      AuthService,
      AuthUserMiddleware,
      JwtAuthGuard,
      RolesGuard,
      { provide: getRepositoryToken(User), useValue: userRepo },
      { provide: getRepositoryToken(RefreshToken), useValue: tokenRepo },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  }).compile();

  const jwtService = moduleRef.get<JwtService>(JwtService);

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const middleware = moduleRef.get<AuthUserMiddleware>(AuthUserMiddleware);
  app.use(middleware.use.bind(middleware));

  await app.init();
  return { app, jwtService };
}

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepoMock: { findOne: jest.Mock };
  let tokenRepoMock: { findOne: jest.Mock; save: jest.Mock; update: jest.Mock };

  beforeAll(async () => {
    userRepoMock = { findOne: jest.fn() };
    tokenRepoMock = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };

    ({ app, jwtService } = await buildTestApp(userRepoMock, tokenRepoMock));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tokenRepoMock.save.mockResolvedValue({});
    tokenRepoMock.update.mockResolvedValue({});
  });

  // ─── Login ───────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns { data: { accessToken, refreshToken }, meta: {} } for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 12);
      userRepoMock.findOne.mockResolvedValue(makeUser({ password_hash: passwordHash }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'correct-password' })
        .expect(200);

      expect(res.body).toMatchObject({
        data: { accessToken: expect.any(String), refreshToken: expect.any(String) },
        meta: {},
      });
    });

    it('returns { error: { code, message } } with HTTP 401 for invalid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 12);
      userRepoMock.findOne.mockResolvedValue(makeUser({ password_hash: passwordHash }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'wrong-password' })
        .expect(401);

      expect(res.body).toHaveProperty('error.code');
      expect(res.body).toHaveProperty('error.message');
    });

    it('returns HTTP 401 when user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password' })
        .expect(401);
    });
  });

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns a new token pair and invalidates the old refresh token', async () => {
      const rawToken = jwtService.sign(
        { sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' },
        { secret: TEST_REFRESH_SECRET, expiresIn: '30d' },
      );
      const tokenHash = await bcrypt.hash(rawToken, 12);
      const activeRecord: RefreshToken = {
        id: 'token-uuid',
        tenant_id: 'tenant-uuid',
        user_id: 'user-uuid',
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        created_at: new Date(),
      };

      tokenRepoMock.findOne.mockResolvedValue(activeRecord);
      userRepoMock.findOne.mockResolvedValue(makeUser());

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(tokenRepoMock.update).toHaveBeenCalledWith(
        { id: 'token-uuid' },
        { revoked_at: expect.any(Date) },
      );
    });

    it('returns HTTP 401 and revokes all sessions when a revoked token is reused', async () => {
      const rawToken = jwtService.sign(
        { sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'revoked-uuid' },
        { secret: TEST_REFRESH_SECRET, expiresIn: '30d' },
      );
      const revokedRecord: RefreshToken = {
        id: 'revoked-uuid',
        tenant_id: 'tenant-uuid',
        user_id: 'user-uuid',
        token_hash: 'irrelevant',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: new Date(Date.now() - 1000),
        created_at: new Date(),
      };

      tokenRepoMock.findOne.mockResolvedValue(revokedRecord);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(401);

      expect(tokenRepoMock.update).toHaveBeenCalledWith(
        { user_id: 'user-uuid', revoked_at: expect.anything() },
        { revoked_at: expect.any(Date) },
      );
    });

    it('returns HTTP 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' })
        .expect(401);
    });
  });

  // ─── Logout ──────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('invalidates only the supplied refresh token', async () => {
      const rawToken = jwtService.sign(
        { sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'logout-token-uuid' },
        { secret: TEST_REFRESH_SECRET, expiresIn: '30d' },
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: rawToken })
        .expect(200);

      expect(res.body).toMatchObject({ data: null, meta: {} });
      expect(tokenRepoMock.update).toHaveBeenCalledWith(
        { id: 'logout-token-uuid', revoked_at: expect.anything() },
        { revoked_at: expect.any(Date) },
      );
      expect(tokenRepoMock.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── JwtAuthGuard ────────────────────────────────────────────────────────────

  describe('JwtAuthGuard', () => {
    it('blocks a request with no Authorization header and returns HTTP 401', async () => {
      await request(app.getHttpServer()).get('/api/test/protected').expect(401);
    });

    it('allows a request with a valid Authorization header', async () => {
      const token = jwtService.sign(
        { sub: 'user-id', tenantId: 'tenant-id', roles: ['admin'] },
        { secret: TEST_JWT_SECRET, expiresIn: '15m' },
      );

      await request(app.getHttpServer())
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ─── AuthUser middleware ──────────────────────────────────────────────────────

  describe('AuthUser middleware', () => {
    it('correctly populates req.user with tenant_id, userId, and roles from the JWT', async () => {
      const token = jwtService.sign(
        { sub: 'user-id-123', tenantId: 'tenant-id-456', roles: ['admin', 'staff'] },
        { secret: TEST_JWT_SECRET, expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/api/test/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        userId: 'user-id-123',
        tenantId: 'tenant-id-456',
        roles: ['admin', 'staff'],
      });
    });
  });

  // ─── Rate limiting ────────────────────────────────────────────────────────────

  describe('Rate limiting', () => {
    it('returns HTTP 429 after exceeding the stricter rate limit on auth endpoints', async () => {
      const limitedUserRepo = { findOne: jest.fn().mockResolvedValue(null) };
      const limitedTokenRepo = {
        findOne: jest.fn(),
        save: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      };
      const { app: limitedApp } = await buildTestApp(limitedUserRepo, limitedTokenRepo);

      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(limitedApp.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'x@example.com', password: 'y' });
        statuses.push(res.status);
      }

      expect(statuses).toContain(429);
      await limitedApp.close();
    }, 20000);
  });
});

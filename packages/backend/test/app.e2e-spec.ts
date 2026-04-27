import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import configuration from '../src/config/configuration';
import { envValidationSchema } from '../src/config/env.schema';

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_HOST = 'localhost';
    process.env.DATABASE_NAME = 'test_cleaning_saas';
    process.env.DATABASE_USER = 'postgres';
    process.env.DATABASE_PASSWORD = 'postgres';
    process.env.JWT_SECRET = 'e2e_test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'e2e_test_jwt_refresh_secret';
    process.env.PORT = '3001';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema: envValidationSchema,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('App startup', () => {
    it('starts successfully with all required env vars present', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Global filter (unknown route)', () => {
    it('returns { error: { code, message } } for unknown route', async () => {
      const response = await request(app.getHttpServer())
        .get('/unknown-route-xyz-does-not-exist')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
    });

    it('does not expose stack traces in error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/nonexistent')
        .expect(404);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body.error).not.toHaveProperty('stack');
    });
  });
});

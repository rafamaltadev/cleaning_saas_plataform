import { envValidationSchema } from './env.schema';

const validEnv = {
  NODE_ENV: 'development',
  PORT: 3000,
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: 5432,
  DATABASE_NAME: 'cleaning_saas',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  JWT_SECRET: 'test_secret',
  JWT_REFRESH_SECRET: 'test_refresh_secret',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '30d',
};

describe('envValidationSchema', () => {
  it('passes validation when all required env vars are present', () => {
    const { error } = envValidationSchema.validate(validEnv, { abortEarly: true });
    expect(error).toBeUndefined();
  });

  it('fails validation when DATABASE_HOST is missing', () => {
    const { DATABASE_HOST: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
    expect(error?.message).toContain('DATABASE_HOST');
  });

  it('fails validation when JWT_SECRET is missing', () => {
    const { JWT_SECRET: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
    expect(error?.message).toContain('JWT_SECRET');
  });

  it('fails validation when DATABASE_NAME is missing', () => {
    const { DATABASE_NAME: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
  });

  it('fails validation when DATABASE_USER is missing', () => {
    const { DATABASE_USER: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
  });

  it('fails validation when DATABASE_PASSWORD is missing', () => {
    const { DATABASE_PASSWORD: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
  });

  it('fails validation when JWT_REFRESH_SECRET is missing', () => {
    const { JWT_REFRESH_SECRET: _, ...env } = validEnv;
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
  });

  it('applies defaults for optional values when omitted', () => {
    const { PORT: _p, NODE_ENV: _n, DATABASE_PORT: _dp, JWT_ACCESS_EXPIRATION: _jae, JWT_REFRESH_EXPIRATION: _jre, ...requiredOnly } = validEnv;
    const { error, value } = envValidationSchema.validate(requiredOnly, { abortEarly: true });
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(3000);
    expect(value.NODE_ENV).toBe('development');
    expect(value.DATABASE_PORT).toBe(5432);
    expect(value.JWT_ACCESS_EXPIRATION).toBe('15m');
    expect(value.JWT_REFRESH_EXPIRATION).toBe('30d');
  });

  it('rejects invalid NODE_ENV values', () => {
    const env = { ...validEnv, NODE_ENV: 'staging' };
    const { error } = envValidationSchema.validate(env, { abortEarly: true });
    expect(error).toBeDefined();
    expect(error?.message).toContain('NODE_ENV');
  });
});

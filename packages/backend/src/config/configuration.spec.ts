import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    Object.assign(process.env, originalEnv);
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key];
    });
  });

  it('returns default port 3000 when PORT is not set', () => {
    delete process.env.PORT;
    expect(configuration().port).toBe(3000);
  });

  it('returns configured port when PORT is set', () => {
    process.env.PORT = '4000';
    expect(configuration().port).toBe(4000);
  });

  it('returns default nodeEnv as development when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV;
    expect(configuration().nodeEnv).toBe('development');
  });

  it('returns database configuration from env vars', () => {
    process.env.DATABASE_HOST = 'db-host';
    process.env.DATABASE_PORT = '5433';
    process.env.DATABASE_NAME = 'my_db';
    process.env.DATABASE_USER = 'my_user';
    process.env.DATABASE_PASSWORD = 'my_pass';

    const config = configuration();
    expect(config.database.host).toBe('db-host');
    expect(config.database.port).toBe(5433);
    expect(config.database.name).toBe('my_db');
    expect(config.database.user).toBe('my_user');
    expect(config.database.password).toBe('my_pass');
  });

  it('returns jwt configuration from env vars', () => {
    process.env.JWT_SECRET = 'my_secret';
    process.env.JWT_REFRESH_SECRET = 'my_refresh_secret';
    process.env.JWT_ACCESS_EXPIRATION = '30m';
    process.env.JWT_REFRESH_EXPIRATION = '60d';

    const config = configuration();
    expect(config.jwt.secret).toBe('my_secret');
    expect(config.jwt.refreshSecret).toBe('my_refresh_secret');
    expect(config.jwt.accessExpiration).toBe('30m');
    expect(config.jwt.refreshExpiration).toBe('60d');
  });

  it('returns default jwt expirations when not set', () => {
    delete process.env.JWT_ACCESS_EXPIRATION;
    delete process.env.JWT_REFRESH_EXPIRATION;
    const config = configuration();
    expect(config.jwt.accessExpiration).toBe('15m');
    expect(config.jwt.refreshExpiration).toBe('30d');
  });

  it('reads throttle limits from env vars', () => {
    process.env.THROTTLE_TTL = '30000';
    process.env.THROTTLE_LIMIT = '200';
    process.env.THROTTLE_AUTH_TTL = '30000';
    process.env.THROTTLE_AUTH_LIMIT = '3';
    const config = configuration();
    expect(config.throttle.ttl).toBe(30000);
    expect(config.throttle.limit).toBe(200);
    expect(config.throttle.authTtl).toBe(30000);
    expect(config.throttle.authLimit).toBe(3);
  });

  it('authLimit default (5) is strictly lower than global limit default (100)', () => {
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    delete process.env.THROTTLE_AUTH_TTL;
    delete process.env.THROTTLE_AUTH_LIMIT;
    const config = configuration();
    expect(config.throttle.authLimit).toBeLessThan(config.throttle.limit);
  });

  it('uses correct defaults for throttle when env vars are not set', () => {
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    delete process.env.THROTTLE_AUTH_TTL;
    delete process.env.THROTTLE_AUTH_LIMIT;
    const config = configuration();
    expect(config.throttle.ttl).toBe(60000);
    expect(config.throttle.limit).toBe(100);
    expect(config.throttle.authTtl).toBe(60000);
    expect(config.throttle.authLimit).toBe(5);
  });
});

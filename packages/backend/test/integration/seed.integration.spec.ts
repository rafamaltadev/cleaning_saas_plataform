import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateTenants1714000000001 } from '../../src/database/migrations/1714000000001-CreateTenants';
import { seed, DEFAULT_TENANT_ID } from '../../src/database/seeds/seed';

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    database: process.env.DATABASE_NAME ?? 'cleaning_saas_test',
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    synchronize: false,
    logging: false,
  });
  await dataSource.initialize();

  // Apply prerequisites
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await new CreateTenants1714000000001().up(dataSource.createQueryRunner());

  // Create minimal users table matching the TechSpec User model
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id   UUID NOT NULL,
      email       VARCHAR NOT NULL UNIQUE,
      password_hash VARCHAR NOT NULL,
      roles       TEXT[] NOT NULL DEFAULT '{}',
      first_name  VARCHAR NOT NULL DEFAULT '',
      last_name   VARCHAR NOT NULL DEFAULT '',
      created_at  TIMESTAMP NOT NULL DEFAULT now(),
      updated_at  TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  process.env.SEED_DEFAULT_PASSWORD = 'TestSeedPassword123!';
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.query('DROP TABLE IF EXISTS users');
    await dataSource.query('DROP TABLE IF EXISTS tenants');
    await dataSource.query('DROP TABLE IF EXISTS typeorm_migrations');
    await dataSource.destroy();
  }
});

describe('Seed script', () => {
  beforeEach(async () => {
    await dataSource.query('DELETE FROM users');
    await dataSource.query('DELETE FROM tenants');
  });

  it('creates exactly one default tenant with the fixed UUID', async () => {
    await seed(dataSource);

    const tenants = await dataSource.query(
      'SELECT id FROM tenants WHERE id = $1',
      [DEFAULT_TENANT_ID],
    );
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe(DEFAULT_TENANT_ID);
  });

  it('creates exactly three seed users under the default tenant', async () => {
    await seed(dataSource);

    const users = await dataSource.query(
      'SELECT email, roles FROM users WHERE tenant_id = $1 ORDER BY email',
      [DEFAULT_TENANT_ID],
    );

    expect(users).toHaveLength(3);

    const emails = users.map((u: { email: string }) => u.email);
    expect(emails).toContain('admin@seed.local');
    expect(emails).toContain('staff@seed.local');
    expect(emails).toContain('supervisor@seed.local');
  });

  it('creates users with the correct roles', async () => {
    await seed(dataSource);

    const admin = await dataSource.query(
      "SELECT roles FROM users WHERE email = 'admin@seed.local'",
    );
    const supervisor = await dataSource.query(
      "SELECT roles FROM users WHERE email = 'supervisor@seed.local'",
    );
    const staff = await dataSource.query(
      "SELECT roles FROM users WHERE email = 'staff@seed.local'",
    );

    expect(admin[0].roles).toContain('tenant_admin');
    expect(supervisor[0].roles).toContain('supervisor');
    expect(staff[0].roles).toContain('staff');
  });

  it('is idempotent — re-running does not create duplicate records', async () => {
    await seed(dataSource);
    await seed(dataSource);

    const tenants = await dataSource.query(
      'SELECT id FROM tenants WHERE id = $1',
      [DEFAULT_TENANT_ID],
    );
    expect(tenants).toHaveLength(1);

    const users = await dataSource.query(
      'SELECT email FROM users WHERE tenant_id = $1',
      [DEFAULT_TENANT_ID],
    );
    expect(users).toHaveLength(3);
  });

  it('throws when SEED_DEFAULT_PASSWORD is not set', async () => {
    const original = process.env.SEED_DEFAULT_PASSWORD;
    delete process.env.SEED_DEFAULT_PASSWORD;

    await expect(seed(dataSource)).rejects.toThrow(
      'SEED_DEFAULT_PASSWORD environment variable is required',
    );

    process.env.SEED_DEFAULT_PASSWORD = original;
  });
});

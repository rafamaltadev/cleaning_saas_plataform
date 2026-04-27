import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { EnableUuidOssp1714000000000 } from '../../src/database/migrations/1714000000000-EnableUuidOssp';
import { CreateTenants1714000000001 } from '../../src/database/migrations/1714000000001-CreateTenants';
import { CreateRefreshTokens1714000000002 } from '../../src/database/migrations/1714000000002-CreateRefreshTokens';
import { CreateAuditLogs1714000000003 } from '../../src/database/migrations/1714000000003-CreateAuditLogs';
import { CreateTenantFeatureFlags1714000000004 } from '../../src/database/migrations/1714000000004-CreateTenantFeatureFlags';

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
    migrations: [
      EnableUuidOssp1714000000000,
      CreateTenants1714000000001,
      CreateRefreshTokens1714000000002,
      CreateAuditLogs1714000000003,
      CreateTenantFeatureFlags1714000000004,
    ],
  });
  await dataSource.initialize();
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});

async function tableExists(name: string): Promise<boolean> {
  const result = await dataSource.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [name],
  );
  return result[0].exists === true;
}

describe('Migrations up()', () => {
  beforeAll(async () => {
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();
  });

  it('creates the tenants table with deleted_at column', async () => {
    expect(await tableExists('tenants')).toBe(true);

    const cols = await dataSource.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'tenants'`,
    );
    const names = cols.map((c: { column_name: string }) => c.column_name);
    expect(names).toContain('deleted_at');
    expect(names).not.toContain('non_existent');
  });

  it('creates the refresh_tokens table without deleted_at column', async () => {
    expect(await tableExists('refresh_tokens')).toBe(true);

    const cols = await dataSource.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'refresh_tokens'`,
    );
    const names = cols.map((c: { column_name: string }) => c.column_name);
    expect(names).not.toContain('deleted_at');
    expect(names).toContain('token_hash');
    expect(names).toContain('revoked_at');
  });

  it('creates the audit_logs table without deleted_at column', async () => {
    expect(await tableExists('audit_logs')).toBe(true);

    const cols = await dataSource.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'audit_logs'`,
    );
    const names = cols.map((c: { column_name: string }) => c.column_name);
    expect(names).not.toContain('deleted_at');
    expect(names).toContain('old_values');
    expect(names).toContain('new_values');
  });

  it('creates the tenant_feature_flags table with deleted_at column', async () => {
    expect(await tableExists('tenant_feature_flags')).toBe(true);

    const cols = await dataSource.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'tenant_feature_flags'`,
    );
    const names = cols.map((c: { column_name: string }) => c.column_name);
    expect(names).toContain('deleted_at');
    expect(names).toContain('feature_name');
    expect(names).toContain('enabled');
  });
});

describe('Migrations down()', () => {
  beforeAll(async () => {
    await dataSource.runMigrations();
  });

  it('rolls back all 4 migrations and leaves no residual tables', async () => {
    await dataSource.undoLastMigration(); // CreateTenantFeatureFlags
    await dataSource.undoLastMigration(); // CreateAuditLogs
    await dataSource.undoLastMigration(); // CreateRefreshTokens
    await dataSource.undoLastMigration(); // CreateTenants
    await dataSource.undoLastMigration(); // EnableUuidOssp

    expect(await tableExists('tenants')).toBe(false);
    expect(await tableExists('refresh_tokens')).toBe(false);
    expect(await tableExists('audit_logs')).toBe(false);
    expect(await tableExists('tenant_feature_flags')).toBe(false);
  });
});

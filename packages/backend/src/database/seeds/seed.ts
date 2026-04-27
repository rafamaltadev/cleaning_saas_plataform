import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

export const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const SEED_USERS = [
  { email: 'admin@seed.local', role: 'tenant_admin' },
  { email: 'supervisor@seed.local', role: 'supervisor' },
  { email: 'staff@seed.local', role: 'staff' },
];

export async function seed(dataSource: DataSource): Promise<void> {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD environment variable is required');
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await dataSource.query(
    `INSERT INTO tenants (id, name, subscription_plan, currency, timezone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_TENANT_ID, 'Default Tenant', 'basic', 'BRL', 'America/Sao_Paulo'],
  );

  for (const user of SEED_USERS) {
    await dataSource.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, roles, first_name, last_name)
       VALUES (uuid_generate_v4(), $1, $2, $3, ARRAY[$4], '', '')
       ON CONFLICT (email) DO NOTHING`,
      [DEFAULT_TENANT_ID, user.email, passwordHash, user.role],
    );
  }
}

if (require.main === module) {
  AppDataSource.initialize()
    .then((ds) => seed(ds))
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

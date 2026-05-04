/** Seed constants — must match packages/backend/src/database/seeds/seed.ts */
export const TENANT_ID =
  process.env.SEED_TENANT_ID ?? 'a0000000-0000-0000-0000-000000000001';

export const SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'seed123';

export const ADMIN_EMAIL = 'admin@seed.local';
export const SUPERVISOR_EMAIL = 'supervisor@seed.local';
export const STAFF_EMAIL = 'staff@seed.local';

/**
 * JWT secret used by the backend in the Docker Compose environment.
 * Defined in docker-compose.yml → JWT_SECRET.
 * Used only in integration tests to generate cross-tenant tokens.
 */
export const DOCKER_JWT_SECRET =
  process.env.JWT_SECRET ?? 'local_dev_secret_change_in_production';

export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

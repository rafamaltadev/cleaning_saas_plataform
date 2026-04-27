import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_EXAMPLE_PATH = join(__dirname, '../.env.example');

const REQUIRED_KEYS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRATION',
  'JWT_REFRESH_EXPIRATION',
];

describe('.env.example', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
  });

  it('exists at packages/backend/.env.example', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('is non-empty', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  REQUIRED_KEYS.forEach((key) => {
    it(`declares key "${key}"`, () => {
      expect(content).toContain(key);
    });
  });

  it('does not contain real secret values for JWT secrets', () => {
    const secretLines = content
      .split('\n')
      .filter((l) => l.includes('SECRET') && !l.trim().startsWith('#'));
    secretLines.forEach((line) => {
      const value = line.split('=').slice(1).join('=').split('#')[0].trim();
      expect(value.toLowerCase()).toMatch(/replace_with|changeme|placeholder|secret/);
    });
  });
});

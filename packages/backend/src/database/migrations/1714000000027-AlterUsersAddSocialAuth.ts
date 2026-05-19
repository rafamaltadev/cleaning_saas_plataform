import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersAddSocialAuth1714000000027 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
        ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS provider_email_verified BOOLEAN NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_unique
        ON users(auth_provider, provider_id)
        WHERE provider_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_provider_unique`);

    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS provider_email_verified,
        DROP COLUMN IF EXISTS provider_id,
        DROP COLUMN IF EXISTS auth_provider
    `);
  }
}

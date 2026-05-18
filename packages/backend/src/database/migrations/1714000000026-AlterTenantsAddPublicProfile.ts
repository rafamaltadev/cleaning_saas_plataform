import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantsAddPublicProfile1714000000026 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS social_links JSONB,
        ADD COLUMN IF NOT EXISTS google_maps_embed_url VARCHAR,
        ADD COLUMN IF NOT EXISTS public_address VARCHAR
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS public_address,
        DROP COLUMN IF EXISTS google_maps_embed_url,
        DROP COLUMN IF EXISTS social_links,
        DROP COLUMN IF EXISTS phone,
        DROP COLUMN IF EXISTS description
    `);
  }
}

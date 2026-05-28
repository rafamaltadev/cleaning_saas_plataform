import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantsAddStripeConnect1714000000034 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR UNIQUE,
        ADD COLUMN IF NOT EXISTS stripe_connect_status VARCHAR,
        ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS stripe_connect_requirements JSONB,
        ADD COLUMN IF NOT EXISTS stripe_connect_country VARCHAR(2),
        ADD COLUMN IF NOT EXISTS payment_mode VARCHAR DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS payment_timing VARCHAR DEFAULT 'prepaid',
        ADD COLUMN IF NOT EXISTS stripe_terms_accepted_version VARCHAR,
        ADD COLUMN IF NOT EXISTS stripe_terms_accepted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS stripe_terms_accepted_ip VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS stripe_connect_account_id,
        DROP COLUMN IF EXISTS stripe_connect_status,
        DROP COLUMN IF EXISTS stripe_connect_charges_enabled,
        DROP COLUMN IF EXISTS stripe_connect_payouts_enabled,
        DROP COLUMN IF EXISTS stripe_connect_requirements,
        DROP COLUMN IF EXISTS stripe_connect_country,
        DROP COLUMN IF EXISTS payment_mode,
        DROP COLUMN IF EXISTS payment_timing,
        DROP COLUMN IF EXISTS stripe_terms_accepted_version,
        DROP COLUMN IF EXISTS stripe_terms_accepted_at,
        DROP COLUMN IF EXISTS stripe_terms_accepted_ip
    `);
  }
}

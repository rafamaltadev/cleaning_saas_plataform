import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantsAddStripeCustomer1714000000033 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR UNIQUE,
        ADD COLUMN IF NOT EXISTS email VARCHAR
    `);

    const nullEmailCount = await queryRunner.query(
      `SELECT COUNT(*) AS cnt FROM tenants WHERE email IS NULL`,
    );
    const count = parseInt(nullEmailCount[0]?.cnt ?? '0', 10);
    if (count > 0) {
      await queryRunner.query(`
        UPDATE tenants
        SET email = 'placeholder-' || id || '@seed.local'
        WHERE email IS NULL
      `);
    }

    await queryRunner.query(`
      ALTER TABLE tenants
        ALTER COLUMN email SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS stripe_customer_id,
        DROP COLUMN IF EXISTS email
    `);
  }
}

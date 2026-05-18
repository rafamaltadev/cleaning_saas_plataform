import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantsAddBranding1714000000025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_slug VARCHAR(60)`);
    await queryRunner.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR`);
    await queryRunner.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7)`);
    await queryRunner.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS favicon_url VARCHAR`);

    await queryRunner.query(
      `UPDATE tenants SET tenant_slug = 'tenant-' || SUBSTRING(id::text, 1, 8) WHERE tenant_slug IS NULL`,
    );

    await queryRunner.query(`ALTER TABLE tenants ALTER COLUMN tenant_slug SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tenants_tenant_slug" ON tenants(tenant_slug)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_tenants_tenant_slug"`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS tenant_slug`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS logo_url`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS primary_color`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS favicon_url`);
  }
}

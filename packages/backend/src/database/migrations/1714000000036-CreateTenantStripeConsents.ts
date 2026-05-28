import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantStripeConsents1714000000036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_stripe_consents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        terms_version VARCHAR NOT NULL REFERENCES stripe_terms_versions(version),
        accepted_at TIMESTAMP NOT NULL,
        accepted_ip VARCHAR NOT NULL,
        accepted_user_agent VARCHAR NOT NULL,
        accepted_by_user_id UUID NOT NULL REFERENCES users(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_stripe_consents_tenant_id
        ON tenant_stripe_consents(tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenant_stripe_consents_tenant_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_stripe_consents`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStripeTermsVersions1714000000035 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stripe_terms_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        version VARCHAR NOT NULL UNIQUE,
        country VARCHAR(2) NOT NULL,
        language VARCHAR(5) NOT NULL,
        content TEXT NOT NULL,
        platform_fee_percent NUMERIC(5,2) NOT NULL,
        stripe_fee_card_percent NUMERIC(5,2) NOT NULL,
        stripe_fee_pix_percent NUMERIC(5,2),
        stripe_fee_ach_percent NUMERIC(5,2),
        effective_from TIMESTAMP NOT NULL,
        effective_until TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stripe_terms_versions`);
  }
}

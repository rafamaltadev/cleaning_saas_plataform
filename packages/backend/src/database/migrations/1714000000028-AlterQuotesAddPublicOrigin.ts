import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterQuotesAddPublicOrigin1714000000028 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quotes
        ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'internal',
        ADD COLUMN IF NOT EXISTS created_by_client_id UUID,
        ADD COLUMN IF NOT EXISTS approval_required BOOLEAN NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_quotes_created_by_client'
            AND table_name = 'quotes'
        ) THEN
          ALTER TABLE quotes
            ADD CONSTRAINT fk_quotes_created_by_client
            FOREIGN KEY (created_by_client_id) REFERENCES clients(id);
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_created_by_client
    `);

    await queryRunner.query(`
      ALTER TABLE quotes
        DROP COLUMN IF EXISTS approval_required,
        DROP COLUMN IF EXISTS created_by_client_id,
        DROP COLUMN IF EXISTS origin
    `);
  }
}

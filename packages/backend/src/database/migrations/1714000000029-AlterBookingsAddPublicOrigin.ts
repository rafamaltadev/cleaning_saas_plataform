import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterBookingsAddPublicOrigin1714000000029 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'internal',
        ADD COLUMN IF NOT EXISTS approval_required BOOLEAN NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bookings
        DROP COLUMN IF EXISTS approval_required,
        DROP COLUMN IF EXISTS origin
    `);
  }
}

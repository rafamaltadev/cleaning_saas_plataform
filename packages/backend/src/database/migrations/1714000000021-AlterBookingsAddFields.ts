import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterBookingsAddFields1714000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('bookings', [
      new TableColumn({ name: 'service_address', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'use_client_address', type: 'boolean', isNullable: false, default: true }),
      new TableColumn({ name: 'observations', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('bookings', [
      'service_address', 'use_client_address', 'observations',
    ]);
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterQuotesAddFields1714000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('quotes', [
      new TableColumn({ name: 'service_address', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'use_client_address', type: 'boolean', isNullable: false, default: true }),
      new TableColumn({ name: 'observations', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'service_date', type: 'timestamp', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('quotes', [
      'service_address', 'use_client_address', 'observations', 'service_date',
    ]);
  }
}

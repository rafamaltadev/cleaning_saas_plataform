import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterQuotesAddAreaSqm1714000000023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'quotes',
      new TableColumn({ name: 'area_sqm', type: 'decimal', precision: 10, scale: 2, isNullable: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('quotes', 'area_sqm');
  }
}

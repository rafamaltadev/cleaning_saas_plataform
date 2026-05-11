import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterServicesAddFields1714000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('services', [
      new TableColumn({ name: 'category_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'estimated_duration_minutes', type: 'integer', isNullable: true }),
      new TableColumn({ name: 'billing_type', type: 'varchar', isNullable: false, default: "'fixed'" }),
      new TableColumn({ name: 'availability', type: 'jsonb', isNullable: true }),
      new TableColumn({ name: 'materials_included', type: 'boolean', isNullable: false, default: false }),
      new TableColumn({ name: 'materials_cost_cents', type: 'integer', isNullable: true }),
      new TableColumn({ name: 'observations', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'has_addons', type: 'boolean', isNullable: false, default: false }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('services', [
      'category_id', 'estimated_duration_minutes', 'billing_type', 'availability',
      'materials_included', 'materials_cost_cents', 'observations', 'has_addons',
    ]);
  }
}

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateServiceCategories1714000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'service_categories',
      new TableIndex({ name: 'IDX_service_categories_tenant_id', columnNames: ['tenant_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('service_categories', 'IDX_service_categories_tenant_id');
    await queryRunner.dropTable('service_categories');
  }
}

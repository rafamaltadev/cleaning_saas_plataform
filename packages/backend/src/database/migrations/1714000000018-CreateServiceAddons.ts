import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateServiceAddons1714000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_addons',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'service_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'price_cents', type: 'integer', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'service_addons',
      new TableIndex({ name: 'IDX_service_addons_tenant_id', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'service_addons',
      new TableIndex({ name: 'IDX_service_addons_service_id', columnNames: ['service_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('service_addons', 'IDX_service_addons_service_id');
    await queryRunner.dropIndex('service_addons', 'IDX_service_addons_tenant_id');
    await queryRunner.dropTable('service_addons');
  }
}

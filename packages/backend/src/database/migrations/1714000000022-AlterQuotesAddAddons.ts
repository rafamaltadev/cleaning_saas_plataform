import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AlterQuotesAddAddons1714000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quote_addons',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'quote_id', type: 'uuid', isNullable: false },
          { name: 'addon_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'price_cents', type: 'integer', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'quote_addons',
      new TableIndex({ name: 'IDX_quote_addons_tenant_id', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'quote_addons',
      new TableIndex({ name: 'IDX_quote_addons_quote_id', columnNames: ['quote_id'] }),
    );

    await queryRunner.createForeignKey(
      'quote_addons',
      new TableForeignKey({
        name: 'FK_quote_addons_addon_id',
        columnNames: ['addon_id'],
        referencedTableName: 'service_addons',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('quote_addons', 'FK_quote_addons_addon_id');
    await queryRunner.dropIndex('quote_addons', 'IDX_quote_addons_quote_id');
    await queryRunner.dropIndex('quote_addons', 'IDX_quote_addons_tenant_id');
    await queryRunner.dropTable('quote_addons');
  }
}

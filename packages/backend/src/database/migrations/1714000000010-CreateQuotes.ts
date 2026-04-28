import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateQuotes1714000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quotes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'client_id', type: 'uuid', isNullable: false },
          { name: 'service_id', type: 'uuid', isNullable: false },
          { name: 'pricing_rule_id', type: 'uuid', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            default: "'draft'",
            isNullable: false,
          },
          { name: 'estimated_total_cents', type: 'integer', isNullable: false },
          { name: 'currency', type: 'varchar', isNullable: false },
          { name: 'valid_until', type: 'timestamp', isNullable: false },
          {
            name: 'manual_discount_percent',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          { name: 'created_by', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'quotes',
      new TableIndex({
        name: 'IDX_quotes_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('quotes', 'IDX_quotes_tenant_id');
    await queryRunner.dropTable('quotes');
  }
}

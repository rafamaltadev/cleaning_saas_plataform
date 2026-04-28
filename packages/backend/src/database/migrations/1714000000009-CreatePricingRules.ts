import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePricingRules1714000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pricing_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'service_id', type: 'uuid', isNullable: false },
          { name: 'min_area', type: 'integer', isNullable: true },
          { name: 'max_area', type: 'integer', isNullable: true },
          { name: 'frequency', type: 'varchar', isNullable: false },
          { name: 'discount_percent', type: 'integer', isNullable: false },
          {
            name: 'price_multiplier',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: false,
          },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'pricing_rules',
      new TableIndex({
        name: 'IDX_pricing_rules_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('pricing_rules', 'IDX_pricing_rules_tenant_id');
    await queryRunner.dropTable('pricing_rules');
  }
}

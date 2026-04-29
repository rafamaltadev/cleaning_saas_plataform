import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePayments1714000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'quote_id', type: 'uuid', isNullable: true },
          { name: 'amount_cents', type: 'integer', isNullable: false },
          { name: 'currency', type: 'varchar', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
            isNullable: false,
          },
          { name: 'payment_method', type: 'varchar', isNullable: false },
          { name: 'external_reference', type: 'varchar', isNullable: true },
          { name: 'idempotency_key', type: 'varchar', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'UQ_payments_tenant_idempotency_key',
        columnNames: ['tenant_id', 'idempotency_key'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('payments', 'UQ_payments_tenant_idempotency_key');
    await queryRunner.dropIndex('payments', 'IDX_payments_tenant_id');
    await queryRunner.dropTable('payments');
  }
}

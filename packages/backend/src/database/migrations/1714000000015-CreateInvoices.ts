import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInvoices1714000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'booking_id', type: 'uuid', isNullable: false },
          { name: 'client_id', type: 'uuid', isNullable: false },
          { name: 'total_cents', type: 'integer', isNullable: false },
          { name: 'currency', type: 'varchar', isNullable: false },
          { name: 'invoice_number', type: 'varchar', isNullable: false },
          { name: 'issued_at', type: 'timestamp', isNullable: false },
          { name: 'due_date', type: 'timestamp', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            default: "'draft'",
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
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'UQ_invoices_tenant_invoice_number',
        columnNames: ['tenant_id', 'invoice_number'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('invoices', 'UQ_invoices_tenant_invoice_number');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_id');
    await queryRunner.dropTable('invoices');
  }
}

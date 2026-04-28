import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBookings1714000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'quote_id', type: 'uuid', isNullable: false },
          { name: 'client_id', type: 'uuid', isNullable: false },
          { name: 'service_id', type: 'uuid', isNullable: false },
          { name: 'scheduled_start', type: 'timestamp', isNullable: false },
          { name: 'scheduled_end', type: 'timestamp', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            default: "'confirmed'",
            isNullable: false,
          },
          { name: 'assigned_team', type: 'varchar', isNullable: true },
          { name: 'idempotency_key', type: 'varchar', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'bookings',
      new TableIndex({
        name: 'IDX_bookings_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'bookings',
      new TableIndex({
        name: 'UQ_bookings_tenant_idempotency_key',
        columnNames: ['tenant_id', 'idempotency_key'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('bookings', 'UQ_bookings_tenant_idempotency_key');
    await queryRunner.dropIndex('bookings', 'IDX_bookings_tenant_id');
    await queryRunner.dropTable('bookings');
  }
}
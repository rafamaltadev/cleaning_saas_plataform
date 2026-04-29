import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNotifications1714000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'client_id', type: 'uuid', isNullable: true },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'quote_id', type: 'uuid', isNullable: true },
          { name: 'type', type: 'varchar', isNullable: false },
          { name: 'template', type: 'varchar', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
            isNullable: false,
          },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'payload', type: 'jsonb', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('notifications', 'IDX_notifications_tenant_id');
    await queryRunner.dropTable('notifications');
  }
}

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuditLogs1714000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'action', type: 'varchar', isNullable: false },
          { name: 'resource_type', type: 'varchar', isNullable: false },
          { name: 'resource_id', type: 'uuid', isNullable: true },
          { name: 'old_values', type: 'jsonb', isNullable: true },
          { name: 'new_values', type: 'jsonb', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}

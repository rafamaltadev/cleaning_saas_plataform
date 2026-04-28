import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAssignments1714000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'booking_id', type: 'uuid', isNullable: false },
          { name: 'employee_id', type: 'uuid', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            default: "'assigned'",
            isNullable: false,
          },
          { name: 'assigned_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_assignments_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('assignments', 'IDX_assignments_tenant_id');
    await queryRunner.dropTable('assignments');
  }
}
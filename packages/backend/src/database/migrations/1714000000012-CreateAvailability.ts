import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAvailability1714000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'availability',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'employee_id', type: 'uuid', isNullable: false },
          { name: 'available_date', type: 'date', isNullable: false },
          { name: 'start_time', type: 'time', isNullable: false },
          { name: 'end_time', type: 'time', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'availability',
      new TableIndex({
        name: 'IDX_availability_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'availability',
      new TableIndex({
        name: 'IDX_availability_employee_date',
        columnNames: ['employee_id', 'available_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('availability', 'IDX_availability_employee_date');
    await queryRunner.dropIndex('availability', 'IDX_availability_tenant_id');
    await queryRunner.dropTable('availability');
  }
}
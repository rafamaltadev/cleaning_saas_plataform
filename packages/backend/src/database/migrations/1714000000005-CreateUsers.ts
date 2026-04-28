import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsers1714000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'password_hash', type: 'varchar', isNullable: false },
          { name: 'roles', type: 'text', isArray: true, isNullable: false, default: "'{}'" },
          { name: 'first_name', type: 'varchar', isNullable: false },
          { name: 'last_name', type: 'varchar', isNullable: false },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropIndex('users', 'IDX_users_tenant_id');
    await queryRunner.dropTable('users');
  }
}

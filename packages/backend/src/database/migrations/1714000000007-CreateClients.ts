import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateClients1714000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'email', type: 'varchar', isNullable: false },
          { name: 'phone', type: 'varchar', isNullable: false },
          { name: 'address_id', type: 'uuid', isNullable: true },
          { name: 'preferred_language', type: 'varchar', isNullable: false, default: "'pt-BR'" },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'clients',
      new TableIndex({
        name: 'IDX_clients_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('clients', 'IDX_clients_tenant_id');
    await queryRunner.dropTable('clients');
  }
}

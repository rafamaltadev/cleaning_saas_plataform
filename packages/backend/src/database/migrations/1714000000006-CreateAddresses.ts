import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAddresses1714000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'street', type: 'varchar', isNullable: false },
          { name: 'city', type: 'varchar', isNullable: false },
          { name: 'state', type: 'varchar', isNullable: false },
          { name: 'postal_code', type: 'varchar', isNullable: false },
          { name: 'country', type: 'varchar', isNullable: false },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('addresses', 'IDX_addresses_tenant_id');
    await queryRunner.dropTable('addresses');
  }
}

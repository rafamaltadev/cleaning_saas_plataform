import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSubscriptionPriceHistory1714000000032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subscription_price_history',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenant_subscription_id', type: 'uuid', isNullable: false },
          { name: 'old_price_cents', type: 'integer', isNullable: false },
          { name: 'new_price_cents', type: 'integer', isNullable: false },
          { name: 'discount_ratio_preserved', type: 'numeric', precision: 5, scale: 4, isNullable: true },
          { name: 'effective_date', type: 'timestamp', isNullable: false },
          { name: 'reason', type: 'varchar', isNullable: false },
          { name: 'notified_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('subscription_price_history');
  }
}

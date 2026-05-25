import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSubscriptionPlans1714000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subscription_plans',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'tier', type: 'varchar', isNullable: false },
          { name: 'stripe_price_id', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'interval', type: 'varchar', isNullable: false },
          { name: 'interval_count', type: 'integer', isNullable: false },
          { name: 'amount_cents', type: 'integer', isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'valid_from', type: 'timestamp', isNullable: false },
          { name: 'valid_until', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'subscription_plans',
      new TableIndex({
        name: 'IDX_subscription_plans_tier_currency_active',
        columnNames: ['tier', 'currency', 'is_active'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'stripe_webhook_events',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'stripe_event_id', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'event_type', type: 'varchar', isNullable: false },
          { name: 'processed_at', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stripe_webhook_events');
    await queryRunner.dropIndex('subscription_plans', 'IDX_subscription_plans_tier_currency_active');
    await queryRunner.dropTable('subscription_plans');
  }
}

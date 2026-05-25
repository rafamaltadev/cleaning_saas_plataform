import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTenantSubscriptions1714000000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenant_subscriptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'plan_id', type: 'uuid', isNullable: false },
          { name: 'stripe_subscription_id', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'stripe_customer_id', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', isNullable: false },
          { name: 'current_period_start', type: 'timestamp', isNullable: false },
          { name: 'current_period_end', type: 'timestamp', isNullable: false },
          { name: 'cancel_at_period_end', type: 'boolean', default: false, isNullable: false },
          { name: 'canceled_at', type: 'timestamp', isNullable: true },
          { name: 'trial_ends_at', type: 'timestamp', isNullable: true },
          { name: 'grandfathered_price_cents', type: 'integer', isNullable: false },
          { name: 'discount_ratio', type: 'numeric', precision: 5, scale: 4, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updated_at', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tenant_subscriptions',
      new TableIndex({
        name: 'IDX_tenant_subscriptions_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('tenant_subscriptions', 'IDX_tenant_subscriptions_tenant_id');
    await queryRunner.dropTable('tenant_subscriptions');
  }
}

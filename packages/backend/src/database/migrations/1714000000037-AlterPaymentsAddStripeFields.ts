import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AlterPaymentsAddStripeFields1714000000037 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Stripe Connect fields to existing payments table
    await queryRunner.addColumns('payments', [
      new TableColumn({ name: 'client_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'stripe_payment_intent_id', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'stripe_charge_id', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'application_fee_cents', type: 'integer', isNullable: true, default: 0 }),
      new TableColumn({ name: 'stripe_fee_cents', type: 'integer', isNullable: true }),
      new TableColumn({ name: 'net_amount_cents', type: 'integer', isNullable: true }),
      new TableColumn({ name: 'payment_mode', type: 'varchar', isNullable: true, default: "'manual'" }),
      new TableColumn({ name: 'payment_timing', type: 'varchar', isNullable: true, default: "'prepaid'" }),
      new TableColumn({ name: 'paid_at', type: 'timestamp', isNullable: true }),
      new TableColumn({ name: 'refunded_at', type: 'timestamp', isNullable: true }),
      new TableColumn({ name: 'failure_reason', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'metadata', type: 'jsonb', isNullable: true }),
    ]);

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_client_id',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_booking_id',
        columnNames: ['booking_id'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'UQ_payments_stripe_payment_intent_id',
        columnNames: ['stripe_payment_intent_id'],
        isUnique: true,
        where: 'stripe_payment_intent_id IS NOT NULL',
      }),
    );

    // Add payment_id to bookings table
    await queryRunner.addColumn(
      'bookings',
      new TableColumn({ name: 'payment_id', type: 'uuid', isNullable: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bookings', 'payment_id');
    await queryRunner.dropIndex('payments', 'UQ_payments_stripe_payment_intent_id');
    await queryRunner.dropIndex('payments', 'IDX_payments_booking_id');
    await queryRunner.dropIndex('payments', 'IDX_payments_status');
    await queryRunner.dropIndex('payments', 'IDX_payments_client_id');
    await queryRunner.dropColumns('payments', [
      'client_id',
      'stripe_payment_intent_id',
      'stripe_charge_id',
      'application_fee_cents',
      'stripe_fee_cents',
      'net_amount_cents',
      'payment_mode',
      'payment_timing',
      'paid_at',
      'refunded_at',
      'failure_reason',
      'metadata',
    ]);
  }
}

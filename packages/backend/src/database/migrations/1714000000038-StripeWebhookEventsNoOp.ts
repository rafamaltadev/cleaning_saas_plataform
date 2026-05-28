import { MigrationInterface, QueryRunner } from 'typeorm';

// stripe_webhook_events table already exists from T22 — this migration is a no-op placeholder
export class StripeWebhookEventsNoOp1714000000038 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Table stripe_webhook_events already exists from migration T22
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Nothing to revert
  }
}

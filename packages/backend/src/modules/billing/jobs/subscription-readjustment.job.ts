import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSubscription } from '../subscriptions/tenant-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/subscription-plan.entity';
import { SubscriptionPriceHistory } from '../subscriptions/subscription-price-history.entity';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { getStripeClient } from '../../../config/stripe.config';

@Injectable()
export class SubscriptionReadjustmentJob {
  private readonly logger = new Logger(SubscriptionReadjustmentJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly stripePlatformService: StripePlatformService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runReadjustment(): Promise<void> {
    if (!getStripeClient()) {
      this.logger.warn('Stripe not configured — skipping readjustment job');
      return;
    }

    this.logger.log('Starting subscription readjustment job');
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 30);

    try {
      const activeSubs = await this.dataSource
        .getRepository(TenantSubscription)
        .find({ where: { status: 'active' } });

      for (const sub of activeSubs) {
        await this.processSubscription(sub, effectiveDate).catch((err) => {
          this.logger.error(`Readjustment failed for subscription ${sub.id}`, err);
        });
      }

      this.logger.log(`Readjustment job complete. Processed ${activeSubs.length} subscriptions.`);
    } catch (err) {
      this.logger.error('Readjustment job failed', err);
    }
  }

  private async processSubscription(sub: TenantSubscription, effectiveDate: Date): Promise<void> {
    const plan = await this.dataSource
      .getRepository(SubscriptionPlan)
      .findOne({ where: { id: sub.plan_id } });

    if (!plan) return;

    const discountRatio = sub.discount_ratio ?? 0;
    const newTenantPriceCents = Math.round(plan.amount_cents * (1 - discountRatio));

    if (newTenantPriceCents === sub.grandfathered_price_cents) return;

    const newStripePrice = await this.stripePlatformService.createPrice({
      productName: plan.name,
      amountCents: newTenantPriceCents,
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.interval_count,
      tier: plan.tier,
    });

    await this.stripePlatformService.updateSubscription({
      subscriptionId: sub.stripe_subscription_id,
      newPriceId: newStripePrice.id,
      prorationBehavior: 'none',
      tenantId: sub.tenant_id,
    });

    await this.dataSource.getRepository(SubscriptionPriceHistory).save({
      tenant_subscription_id: sub.id,
      old_price_cents: sub.grandfathered_price_cents,
      new_price_cents: newTenantPriceCents,
      discount_ratio_preserved: discountRatio,
      effective_date: effectiveDate,
      reason: 'annual_readjustment',
      notified_at: null,
    });

    sub.grandfathered_price_cents = newTenantPriceCents;
    await this.dataSource.getRepository(TenantSubscription).save(sub);

    this.logger.log(
      `Readjusted sub ${sub.id}: ${sub.grandfathered_price_cents} → ${newTenantPriceCents} cents`,
    );
  }
}

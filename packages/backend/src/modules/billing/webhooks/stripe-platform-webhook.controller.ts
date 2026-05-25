import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../../common/decorators/public.decorator';
import { getStripeClient, getStripeWebhookSecret } from '../../../config/stripe.config';
import { StripeWebhookEvent } from '../subscriptions/stripe-webhook-event.entity';
import { TenantSubscription } from '../subscriptions/tenant-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/subscription-plan.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
import type { SubscriptionStatus } from '../subscriptions/tenant-subscription.entity';

@ApiTags('webhooks')
@Controller('v1/webhooks/stripe')
export class StripePlatformWebhookController {
  private readonly logger = new Logger(StripePlatformWebhookController.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Post('platform')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe platform webhook' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ): Promise<{ received: boolean }> {
    const stripe = getStripeClient();
    if (!stripe) {
      this.logger.warn('Stripe not configured — webhook ignored');
      return { received: true };
    }

    let event: any;
    try {
      const rawBody = req.rawBody;
      if (!rawBody) throw new Error('Missing raw body');
      event = stripe.webhooks.constructEvent(rawBody, sig, getStripeWebhookSecret());
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException('Invalid Stripe signature');
    }

    const alreadyProcessed = await this.dataSource
      .getRepository(StripeWebhookEvent)
      .findOne({ where: { stripe_event_id: event.id } });

    if (alreadyProcessed) {
      this.logger.log(`Duplicate webhook event ${event.id} — skipping`);
      return { received: true };
    }

    await this.processEvent(event).catch((err) => {
      this.logger.error(`Webhook processing error for event ${event.id}`, err);
    });

    await this.dataSource.getRepository(StripeWebhookEvent).save({
      stripe_event_id: event.id,
      event_type: event.type,
    }).catch((saveErr) => {
      this.logger.error('Failed to persist webhook event id', saveErr);
    });

    return { received: true };
  }

  private async processEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: any): Promise<void> {
    const tenantId = session.metadata?.tenant_id;
    const planId = session.metadata?.plan_id;
    if (!tenantId || !planId || !session.subscription) return;

    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as any)?.id ?? '';

    const plan = await this.dataSource
      .getRepository(SubscriptionPlan)
      .findOne({ where: { id: planId } });
    if (!plan) {
      this.logger.error(`Plan ${planId} not found for checkout.session.completed`);
      return;
    }

    const stripe = getStripeClient()!;
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const existing = await this.dataSource
      .getRepository(TenantSubscription)
      .findOne({ where: { stripe_subscription_id: stripeSubscriptionId } });

    if (!existing) {
      const discountRatio = plan.amount_cents > 0
        ? Math.max(0, 1 - plan.amount_cents / plan.amount_cents)
        : 0;

      await this.dataSource.getRepository(TenantSubscription).save({
        tenant_id: tenantId,
        plan_id: planId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: customerId,
        status: stripeSub.status as SubscriptionStatus,
        current_period_start: new Date(stripeSub.current_period_start * 1000),
        current_period_end: new Date(stripeSub.current_period_end * 1000),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        canceled_at: null,
        trial_ends_at: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        grandfathered_price_cents: plan.amount_cents,
        discount_ratio: discountRatio,
      });
    }

    await this.dataSource.getRepository(Tenant).update(
      { id: tenantId },
      { stripe_customer_id: customerId },
    );

    await this.logAudit(tenantId, 'checkout.session.completed', 'tenant_subscription', stripeSubscriptionId);
  }

  private async handleSubscriptionUpdated(sub: any): Promise<void> {
    const tenantId = sub.metadata?.tenant_id;
    if (!tenantId) return;

    await this.dataSource.getRepository(TenantSubscription).update(
      { stripe_subscription_id: sub.id },
      {
        status: sub.status as SubscriptionStatus,
        current_period_start: new Date(sub.current_period_start * 1000),
        current_period_end: new Date(sub.current_period_end * 1000),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      },
    );

    await this.logAudit(tenantId, 'customer.subscription.updated', 'tenant_subscription', sub.id);
  }

  private async handleSubscriptionDeleted(sub: any): Promise<void> {
    const tenantId = sub.metadata?.tenant_id;

    await this.dataSource.getRepository(TenantSubscription).update(
      { stripe_subscription_id: sub.id },
      { status: 'canceled', canceled_at: new Date() },
    );

    if (tenantId) {
      await this.logAudit(tenantId, 'customer.subscription.deleted', 'tenant_subscription', sub.id);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    const subId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
    if (!subId) return;

    const sub = await this.dataSource
      .getRepository(TenantSubscription)
      .findOne({ where: { stripe_subscription_id: subId } });
    if (!sub) return;

    if (sub.status === 'past_due') {
      sub.status = 'active';
      await this.dataSource.getRepository(TenantSubscription).save(sub);
    }

    this.logger.log(`Payment succeeded for subscription ${subId}`);
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const subId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
    if (!subId) return;

    await this.dataSource.getRepository(TenantSubscription).update(
      { stripe_subscription_id: subId },
      { status: 'past_due' },
    );

    this.logger.warn(`Payment failed for subscription ${subId}`);
  }

  private async handleTrialWillEnd(sub: any): Promise<void> {
    const tenantId = sub.metadata?.tenant_id;
    this.logger.log(`Trial will end soon for tenant ${tenantId ?? 'unknown'}, subscription ${sub.id}`);
  }

  private async logAudit(
    tenantId: string,
    action: string,
    resourceType: string,
    resourceId: string,
  ): Promise<void> {
    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: tenantId,
      user_id: null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: null,
      new_values: null,
    }).catch((err) => this.logger.error('Audit log failed', err));
  }
}

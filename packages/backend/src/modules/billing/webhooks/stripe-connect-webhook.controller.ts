import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { Public } from '../../../common/decorators/public.decorator';
import { StripeWebhookEvent } from '../subscriptions/stripe-webhook-event.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
import { Payment } from '../domain/payment.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import type { Stripe } from 'stripe/cjs/stripe.core';

@ApiTags('webhooks')
@Controller('v1/webhooks/stripe')
export class StripeConnectWebhookController {
  private readonly logger = new Logger(StripeConnectWebhookController.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Post('connect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe Connect webhook' })
  async handleConnectWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ): Promise<{ received: boolean }> {
    const secretKey = process.env.STRIPE_PLATFORM_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('STRIPE_PLATFORM_SECRET_KEY not set — Connect webhook ignored');
      return { received: true };
    }

    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'placeholder') {
      this.logger.warn('STRIPE_CONNECT_WEBHOOK_SECRET not configured — Connect webhook ignored');
      return { received: true };
    }

    const StripeLib = require('stripe');
    const stripe = new StripeLib(secretKey, { apiVersion: '2026-04-22.dahlia' });

    let event: Stripe.Event;
    try {
      const rawBody = req.rawBody;
      if (!rawBody) throw new Error('Missing raw body');
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      this.logger.error('Connect webhook signature verification failed', err);
      throw new BadRequestException('Invalid Stripe Connect signature');
    }

    const alreadyProcessed = await this.dataSource
      .getRepository(StripeWebhookEvent)
      .findOne({ where: { stripe_event_id: event.id } });

    if (alreadyProcessed) {
      this.logger.log(`Duplicate Connect webhook event ${event.id} — skipping`);
      return { received: true };
    }

    let processingError: unknown = null;
    try {
      await this.processEvent(event, stripe);
    } catch (err) {
      processingError = err;
      this.logger.error(`Connect webhook processing error for event ${event.id}: ${(err as Error).message}`, err);
    }

    await this.dataSource.getRepository(StripeWebhookEvent).save({
      stripe_event_id: event.id,
      event_type: event.type,
    }).catch((saveErr) => {
      this.logger.error('Failed to persist Connect webhook event id', saveErr);
    });

    if (processingError) {
      throw processingError;
    }

    return { received: true };
  }

  private async processEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'account.application.deauthorized':
        await this.handleAccountDeauthorized(event.data.object as any);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, stripe);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      default:
        this.logger.log(`Unhandled Connect webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    stripe: Stripe,
  ): Promise<void> {
    const payment = await this.dataSource.getRepository(Payment).findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });
    if (!payment) {
      this.logger.warn(`payment_intent.succeeded: no payment found for intent ${paymentIntent.id}`);
      return;
    }

    let stripeFee: number | null = null;
    let netAmount: number | null = null;

    // Retrieve balance transaction to get Stripe fee
    try {
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as any)?.id;
      if (chargeId) {
        const stripeAcct = (paymentIntent.transfer_data?.destination as string | undefined);
        const charge = await stripe.charges.retrieve(
          chargeId,
          { expand: ['balance_transaction'] },
          stripeAcct ? { stripeAccount: stripeAcct } : {},
        );
        const bt = charge.balance_transaction as Stripe.BalanceTransaction | null;
        if (bt) {
          stripeFee = bt.fee;
          netAmount = bt.net;
        }
      }
    } catch (err) {
      this.logger.warn(`Could not retrieve balance transaction for ${paymentIntent.id}: ${(err as Error).message}`);
    }

    payment.status = 'succeeded';
    payment.paid_at = new Date(paymentIntent.created * 1000);
    if (stripeFee !== null) payment.stripe_fee_cents = stripeFee;
    if (netAmount !== null) payment.net_amount_cents = netAmount;

    const chargeIdValue = typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id ?? null;
    if (chargeIdValue) payment.stripe_charge_id = chargeIdValue;

    await this.dataSource.getRepository(Payment).save(payment);

    // If prepaid — transition booking to confirmed
    if (payment.payment_timing === 'prepaid' && payment.booking_id) {
      const booking = await this.dataSource.getRepository(Booking).findOne({
        where: { id: payment.booking_id, deleted_at: IsNull() },
      });
      if (booking && booking.status === 'pending_payment') {
        booking.status = 'confirmed';
        await this.dataSource.getRepository(Booking).save(booking);
        this.logger.log(`Booking ${booking.id} confirmed via payment ${payment.id}`);
      }
    }

    await this.logAudit(payment.tenant_id, 'payment.succeeded', 'payment', payment.id);
    this.logger.log(`PaymentIntent ${paymentIntent.id} succeeded for payment ${payment.id}`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.dataSource.getRepository(Payment).findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });
    if (!payment) {
      this.logger.warn(`payment_intent.payment_failed: no payment found for intent ${paymentIntent.id}`);
      return;
    }

    const lastError = paymentIntent.last_payment_error;
    payment.status = 'failed';
    payment.failure_reason = lastError?.message ?? 'Payment failed';
    await this.dataSource.getRepository(Payment).save(payment);

    await this.logAudit(payment.tenant_id, 'payment.failed', 'payment', payment.id);
    this.logger.log(`PaymentIntent ${paymentIntent.id} failed for payment ${payment.id}: ${payment.failure_reason}`);
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const piId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
    if (!piId) return;

    const payment = await this.dataSource.getRepository(Payment).findOne({
      where: { stripe_payment_intent_id: piId },
    });
    if (!payment) {
      this.logger.warn(`charge.refunded: no payment found for intent ${piId}`);
      return;
    }

    payment.status = 'refunded';
    payment.refunded_at = new Date();
    await this.dataSource.getRepository(Payment).save(payment);

    await this.logAudit(payment.tenant_id, 'payment.refunded', 'payment', payment.id);
    this.logger.log(`Charge refunded for payment ${payment.id}`);
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const piId = typeof dispute.payment_intent === 'string'
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

    const payment = piId
      ? await this.dataSource.getRepository(Payment).findOne({
          where: { stripe_payment_intent_id: piId },
        })
      : null;

    const tenantId = payment?.tenant_id ?? 'unknown';
    const resourceId = payment?.id ?? dispute.id;

    await this.logAudit(tenantId, 'payment.dispute_created', 'payment', resourceId);
    this.logger.warn(`Dispute created for payment_intent ${piId ?? 'unknown'}, dispute ${dispute.id}`);
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const tenantId = account.metadata?.tenant_id;
    if (!tenantId) {
      this.logger.warn(`account.updated event for account ${account.id} has no tenant_id metadata`);
      return;
    }

    await this.dataSource.getRepository(Tenant).update(
      { stripe_connect_account_id: account.id },
      {
        stripe_connect_status: account.details_submitted ? 'active' : 'pending',
        stripe_connect_charges_enabled: account.charges_enabled ?? false,
        stripe_connect_payouts_enabled: account.payouts_enabled ?? false,
        stripe_connect_requirements: (account.requirements as any) ?? null,
      },
    );

    await this.logAudit(tenantId, 'stripe_connect.account_updated', 'tenant', tenantId);
    this.logger.log(`Updated Connect account status for tenant ${tenantId}`);
  }

  private async handleAccountDeauthorized(event: any): Promise<void> {
    const accountId: string = event.id ?? event.account;
    if (!accountId) {
      this.logger.warn('account.application.deauthorized event missing account id');
      return;
    }

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { stripe_connect_account_id: accountId } });

    if (!tenant) {
      this.logger.warn(`No tenant found for deauthorized account ${accountId}`);
      return;
    }

    await this.dataSource.getRepository(Tenant).update(
      { stripe_connect_account_id: accountId },
      {
        stripe_connect_account_id: null,
        stripe_connect_status: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_requirements: null,
      },
    );

    await this.logAudit(tenant.id, 'stripe_connect.account_deauthorized', 'tenant', tenant.id);
    this.logger.log(`Deauthorized Connect account ${accountId} for tenant ${tenant.id}`);
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

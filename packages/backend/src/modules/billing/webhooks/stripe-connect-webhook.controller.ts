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
import { DataSource } from 'typeorm';
import { Public } from '../../../common/decorators/public.decorator';
import { StripeWebhookEvent } from '../subscriptions/stripe-webhook-event.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
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
      await this.processEvent(event);
    } catch (err) {
      processingError = err;
      this.logger.error(`Connect webhook processing error for event ${event.id}`, err);
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

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'account.application.deauthorized':
        await this.handleAccountDeauthorized(event.data.object as any);
        break;
      default:
        this.logger.log(`Unhandled Connect webhook event type: ${event.type}`);
    }
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

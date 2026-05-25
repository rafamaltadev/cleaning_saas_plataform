import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { getStripeClient } from '../../../config/stripe.config';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class StripePlatformService {
  private readonly logger = new Logger(StripePlatformService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private getStripe(): any {
    const client = getStripeClient();
    if (!client) {
      throw new InternalServerErrorException('Stripe is not configured');
    }
    return client;
  }

  async createCustomer(tenant: Tenant): Promise<any> {
    const stripe = this.getStripe();
    try {
      const customer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: { tenant_id: tenant.id, tenant_slug: tenant.tenant_slug },
      });
      return customer;
    } catch (err) {
      await this.logAuditError('stripe.createCustomer', tenant.id, err);
      throw err;
    }
  }

  async createCheckoutSession(params: {
    tenantId: string;
    planId: string;
    stripePriceId: string;
    customerId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkout_url: string; session_id: string }> {
    const stripe = this.getStripe();
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: params.customerId,
        line_items: [{ price: params.stripePriceId, quantity: 1 }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: { tenant_id: params.tenantId, plan_id: params.planId },
        subscription_data: {
          metadata: { tenant_id: params.tenantId, plan_id: params.planId },
        },
      });
      return { checkout_url: session.url!, session_id: session.id };
    } catch (err) {
      await this.logAuditError('stripe.createCheckoutSession', params.tenantId, err);
      throw err;
    }
  }

  async cancelSubscription(params: {
    subscriptionId: string;
    atPeriodEnd: boolean;
    tenantId: string;
  }): Promise<any> {
    const stripe = this.getStripe();
    try {
      if (params.atPeriodEnd) {
        return await stripe.subscriptions.update(params.subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      return await stripe.subscriptions.cancel(params.subscriptionId);
    } catch (err) {
      await this.logAuditError('stripe.cancelSubscription', params.tenantId, err);
      throw err;
    }
  }

  async updateSubscription(params: {
    subscriptionId: string;
    newPriceId: string;
    prorationBehavior: string;
    tenantId: string;
  }): Promise<any> {
    const stripe = this.getStripe();
    try {
      const sub = await stripe.subscriptions.retrieve(params.subscriptionId);
      const itemId = sub.items.data[0]?.id;
      if (!itemId) throw new Error('Subscription has no items');

      return await stripe.subscriptions.update(params.subscriptionId, {
        items: [{ id: itemId, price: params.newPriceId }],
        proration_behavior: params.prorationBehavior,
      });
    } catch (err) {
      await this.logAuditError('stripe.updateSubscription', params.tenantId, err);
      throw err;
    }
  }

  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
    tenantId: string;
  }): Promise<{ url: string }> {
    const stripe = this.getStripe();
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
      return { url: session.url };
    } catch (err) {
      await this.logAuditError('stripe.createPortalSession', params.tenantId, err);
      throw err;
    }
  }

  async createPrice(params: {
    productName: string;
    amountCents: number;
    currency: string;
    interval: string;
    intervalCount: number;
    tier: string;
  }): Promise<any> {
    const stripe = this.getStripe();
    const stripeInterval: any = params.interval === 'semiannual' ? 'month' : params.interval;
    const stripeIntervalCount = params.interval === 'semiannual' ? 6 : params.intervalCount;

    const product = await stripe.products.create({
      name: `${params.productName} (${params.tier})`,
      metadata: { tier: params.tier },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.amountCents,
      currency: params.currency.toLowerCase(),
      recurring: { interval: stripeInterval, interval_count: stripeIntervalCount },
      metadata: { tier: params.tier },
    });

    return price;
  }

  private async logAuditError(action: string, tenantId: string, err: unknown): Promise<void> {
    try {
      await this.dataSource.getRepository(AuditLog).save({
        tenant_id: tenantId,
        user_id: null,
        action,
        resource_type: 'stripe',
        resource_id: null,
        old_values: null,
        new_values: { error: String(err) },
      });
    } catch (logErr) {
      this.logger.error('Failed to write audit log for Stripe error', logErr);
    }
  }
}

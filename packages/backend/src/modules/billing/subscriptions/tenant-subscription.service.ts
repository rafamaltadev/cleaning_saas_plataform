import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { CreateCheckoutSessionDto } from '../validation/create-checkout-session.dto';
import { CancelSubscriptionDto } from '../validation/cancel-subscription.dto';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
import { getStripePublishableKey } from '../../../config/stripe.config';

@Injectable()
export class TenantSubscriptionService {
  private readonly logger = new Logger(TenantSubscriptionService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly stripePlatformService: StripePlatformService,
  ) {}

  getPublishableKey(): string {
    return getStripePublishableKey();
  }

  async getMySubscription(tenantId: string): Promise<TenantSubscription | null> {
    return this.dataSource.getRepository(TenantSubscription).findOne({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async createCheckout(
    tenantId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ checkout_url: string; session_id: string }> {
    const plan = await this.dataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: dto.plan_id, is_active: true, deleted_at: IsNull() },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const tenant = await this.dataSource.getRepository(Tenant).findOne({
      where: { id: tenantId, deleted_at: IsNull() },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await this.stripePlatformService.createCustomer(tenant);
      customerId = customer.id;
      await this.dataSource.getRepository(Tenant).update({ id: tenantId }, { stripe_customer_id: customerId });
    }

    return this.stripePlatformService.createCheckoutSession({
      tenantId,
      planId: plan.id,
      stripePriceId: plan.stripe_price_id,
      customerId,
      successUrl: dto.success_url,
      cancelUrl: dto.cancel_url,
    });
  }

  async openPortal(tenantId: string, returnUrl: string): Promise<{ url: string }> {
    const tenant = await this.dataSource.getRepository(Tenant).findOne({
      where: { id: tenantId, deleted_at: IsNull() },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (!tenant.stripe_customer_id) {
      throw new BadRequestException('No billing account found for this tenant');
    }
    return this.stripePlatformService.createPortalSession({
      customerId: tenant.stripe_customer_id,
      returnUrl,
      tenantId,
    });
  }

  async cancel(tenantId: string, dto: CancelSubscriptionDto): Promise<TenantSubscription> {
    const sub = await this.dataSource.getRepository(TenantSubscription).findOne({
      where: { tenant_id: tenantId, status: 'active' },
    });
    if (!sub) throw new NotFoundException('No active subscription found');

    await this.stripePlatformService.cancelSubscription({
      subscriptionId: sub.stripe_subscription_id,
      atPeriodEnd: dto.at_period_end,
      tenantId,
    });

    sub.cancel_at_period_end = dto.at_period_end;
    if (!dto.at_period_end) {
      sub.status = 'canceled';
      sub.canceled_at = new Date();
    }

    const updated = await this.dataSource.getRepository(TenantSubscription).save(sub);

    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: tenantId,
      user_id: null,
      action: 'cancel',
      resource_type: 'tenant_subscription',
      resource_id: sub.id,
      old_values: { status: 'active' },
      new_values: { cancel_at_period_end: dto.at_period_end, reason: dto.reason },
    });

    return updated;
  }

  async changePlan(tenantId: string, newPlanId: string): Promise<TenantSubscription> {
    const sub = await this.dataSource.getRepository(TenantSubscription).findOne({
      where: { tenant_id: tenantId, status: 'active' },
    });
    if (!sub) throw new NotFoundException('No active subscription found');

    const newPlan = await this.dataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: newPlanId, is_active: true, deleted_at: IsNull() },
    });
    if (!newPlan) throw new NotFoundException('Plan not found');

    await this.stripePlatformService.updateSubscription({
      subscriptionId: sub.stripe_subscription_id,
      newPriceId: newPlan.stripe_price_id,
      prorationBehavior: 'create_prorations',
      tenantId,
    });

    const oldPriceCents = sub.grandfathered_price_cents;
    const newDiscountRatio = newPlan.amount_cents > 0
      ? Math.max(0, 1 - oldPriceCents / newPlan.amount_cents)
      : 0;

    sub.plan_id = newPlanId;
    sub.grandfathered_price_cents = newPlan.amount_cents;
    sub.discount_ratio = newDiscountRatio;

    return this.dataSource.getRepository(TenantSubscription).save(sub);
  }

  async getAllSubscriptions(filters?: {
    status?: string;
    tenantId?: string;
    planId?: string;
  }): Promise<TenantSubscription[]> {
    const repo = this.dataSource.getRepository(TenantSubscription);
    const qb = repo.createQueryBuilder('ts');

    if (filters?.status) qb.andWhere('ts.status = :status', { status: filters.status });
    if (filters?.tenantId) qb.andWhere('ts.tenant_id = :tenantId', { tenantId: filters.tenantId });
    if (filters?.planId) qb.andWhere('ts.plan_id = :planId', { planId: filters.planId });

    qb.orderBy('ts.created_at', 'DESC');
    return qb.getMany();
  }
}

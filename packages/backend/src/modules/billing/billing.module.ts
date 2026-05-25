import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './domain/invoice.entity';
import { Payment } from './domain/payment.entity';
import { SubscriptionPlan } from './subscriptions/subscription-plan.entity';
import { TenantSubscription } from './subscriptions/tenant-subscription.entity';
import { SubscriptionPriceHistory } from './subscriptions/subscription-price-history.entity';
import { StripeWebhookEvent } from './subscriptions/stripe-webhook-event.entity';
import { Tenant } from '../tenant/domain/tenant.entity';
import { AuditLog } from '../audit-log/domain/audit-log.entity';
import { InvoiceRepository } from './infrastructure/invoice.repository';
import { PaymentRepository } from './infrastructure/payment.repository';
import { InvoiceNumberService } from './application/invoice-number.service';
import { BillingService } from './application/billing.service';
import { StripePlatformService } from './stripe/stripe-platform.service';
import { SubscriptionPlanService } from './subscriptions/subscription-plan.service';
import { TenantSubscriptionService } from './subscriptions/tenant-subscription.service';
import { SubscriptionReadjustmentJob } from './jobs/subscription-readjustment.job';
import { InvoicesController } from './interfaces/invoices.controller';
import { PaymentsController } from './interfaces/payments.controller';
import { BillingController } from './interfaces/billing.controller';
import { AdminSubscriptionController } from './interfaces/admin-subscription.controller';
import { StripePlatformWebhookController } from './webhooks/stripe-platform-webhook.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Payment,
      SubscriptionPlan,
      TenantSubscription,
      SubscriptionPriceHistory,
      StripeWebhookEvent,
      Tenant,
      AuditLog,
    ]),
    AuthModule,
  ],
  providers: [
    InvoiceRepository,
    PaymentRepository,
    InvoiceNumberService,
    BillingService,
    StripePlatformService,
    SubscriptionPlanService,
    TenantSubscriptionService,
    SubscriptionReadjustmentJob,
  ],
  controllers: [
    InvoicesController,
    PaymentsController,
    BillingController,
    AdminSubscriptionController,
    StripePlatformWebhookController,
  ],
  exports: [BillingService, SubscriptionPlanService, TenantSubscriptionService],
})
export class BillingModule {}

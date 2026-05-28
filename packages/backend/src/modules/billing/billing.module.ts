import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './domain/invoice.entity';
import { Payment } from './domain/payment.entity';
import { SubscriptionPlan } from './subscriptions/subscription-plan.entity';
import { TenantSubscription } from './subscriptions/tenant-subscription.entity';
import { SubscriptionPriceHistory } from './subscriptions/subscription-price-history.entity';
import { StripeWebhookEvent } from './subscriptions/stripe-webhook-event.entity';
import { StripeTermsVersion } from './connect/stripe-terms-version.entity';
import { TenantStripeConsent } from './connect/tenant-stripe-consent.entity';
import { Tenant } from '../tenant/domain/tenant.entity';
import { AuditLog } from '../audit-log/domain/audit-log.entity';
import { User } from '../auth/domain/user.entity';
import { Client } from '../clients/domain/client.entity';
import { Booking } from '../bookings/domain/booking.entity';
import { InvoiceRepository } from './infrastructure/invoice.repository';
import { PaymentRepository } from './infrastructure/payment.repository';
import { InvoiceNumberService } from './application/invoice-number.service';
import { BillingService } from './application/billing.service';
import { StripePlatformService } from './stripe/stripe-platform.service';
import { StripeConnectService } from './stripe/stripe-connect.service';
import { StripeTermsService } from './connect/stripe-terms.service';
import { SubscriptionPlanService } from './subscriptions/subscription-plan.service';
import { TenantSubscriptionService } from './subscriptions/tenant-subscription.service';
import { SubscriptionReadjustmentJob } from './jobs/subscription-readjustment.job';
import { PaymentService } from './payments/payment.service';
import { PublicPaymentService } from './payments/public-payment.service';
import { InvoicesController } from './interfaces/invoices.controller';
import { PaymentsController } from './interfaces/payments.controller';
import { BillingController } from './interfaces/billing.controller';
import { AdminSubscriptionController } from './interfaces/admin-subscription.controller';
import { ConnectController } from './interfaces/connect.controller';
import { PaymentConfigController } from './interfaces/payment-config.controller';
import { PaymentController } from './payments/payment.controller';
import { PublicPaymentController } from './payments/public-payment.controller';
import { StripePlatformWebhookController } from './webhooks/stripe-platform-webhook.controller';
import { StripeConnectWebhookController } from './webhooks/stripe-connect-webhook.controller';
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
      StripeTermsVersion,
      TenantStripeConsent,
      Tenant,
      AuditLog,
      User,
      Client,
      Booking,
    ]),
    AuthModule,
  ],
  providers: [
    InvoiceRepository,
    PaymentRepository,
    InvoiceNumberService,
    BillingService,
    StripePlatformService,
    StripeConnectService,
    StripeTermsService,
    SubscriptionPlanService,
    TenantSubscriptionService,
    SubscriptionReadjustmentJob,
    PaymentService,
    PublicPaymentService,
  ],
  controllers: [
    InvoicesController,
    PaymentsController,
    BillingController,
    AdminSubscriptionController,
    ConnectController,
    PaymentConfigController,
    PaymentController,
    PublicPaymentController,
    StripePlatformWebhookController,
    StripeConnectWebhookController,
  ],
  exports: [BillingService, SubscriptionPlanService, TenantSubscriptionService, PaymentService],
})
export class BillingModule {}

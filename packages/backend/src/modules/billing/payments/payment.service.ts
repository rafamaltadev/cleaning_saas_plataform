import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import type { Stripe } from 'stripe/cjs/stripe.core';
import { Payment } from '../domain/payment.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';

export const PLATFORM_FEE_PERCENT = 1;
export const PAYMENT_LINK_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export type SupportedPaymentMethod = 'card' | 'pix' | 'ach' | 'apple_pay' | 'google_pay';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private getStripe(): Stripe {
    const secretKey = process.env.STRIPE_PLATFORM_SECRET_KEY;
    if (!secretKey) throw new InternalServerErrorException('STRIPE_PLATFORM_SECRET_KEY not set');
    const StripeLib = require('stripe');
    return new StripeLib(secretKey, { apiVersion: '2026-04-22.dahlia' });
  }

  getPaymentMethodsForRegion(country: string): SupportedPaymentMethod[] {
    if (country === 'BR') return ['card', 'pix'];
    if (country === 'US') return ['card', 'ach', 'apple_pay', 'google_pay'];
    return ['card'];
  }

  async createPaymentIntent(params: {
    bookingId: string;
    tenantId: string;
    clientId: string;
  }): Promise<{ clientSecret: string; publishableKey: string; paymentMethods: string[] }> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: params.tenantId, deleted_at: IsNull() },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!tenant.stripe_connect_account_id || !tenant.stripe_connect_charges_enabled) {
      throw new BadRequestException({
        code: 'STRIPE_CONNECT_NOT_ACTIVE',
        message: 'Tenant Stripe Connect is not active',
      });
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: params.bookingId, tenant_id: params.tenantId, deleted_at: IsNull() },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (!['pending_approval', 'pending_payment'].includes(booking.status)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: `Cannot create payment for booking with status '${booking.status}'`,
      });
    }

    // Look up quote total
    const [quoteRow] = await this.dataSource.query(
      `SELECT estimated_total_cents, currency FROM quotes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [booking.quote_id, params.tenantId],
    ) as { estimated_total_cents: number; currency: string }[];

    if (!quoteRow) throw new NotFoundException('Quote not found for booking');

    const amountCents = Number(quoteRow.estimated_total_cents);
    const currency = (quoteRow.currency ?? 'BRL').toLowerCase();
    const applicationFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

    const country = tenant.stripe_connect_country ?? 'BR';
    const paymentMethods = this.getPaymentMethodsForRegion(country);

    const stripe = this.getStripe();
    const stripeAccountId = tenant.stripe_connect_account_id!;

    const existingPayment = await this.paymentRepo.findOne({
      where: { booking_id: params.bookingId, tenant_id: params.tenantId, deleted_at: IsNull() },
    });

    let payment: Payment;
    let paymentIntent: Stripe.PaymentIntent;

    if (existingPayment?.stripe_payment_intent_id) {
      // Reuse existing intent
      paymentIntent = await stripe.paymentIntents.retrieve(
        existingPayment.stripe_payment_intent_id,
        {},
        { stripeAccount: stripeAccountId },
      );
      payment = existingPayment;
    } else {
      const pmTypes: string[] = paymentMethods.includes('pix') ? ['card', 'pix'] : ['card'];

      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency,
          payment_method_types: pmTypes,
          application_fee_amount: applicationFeeCents,
          metadata: {
            booking_id: params.bookingId,
            tenant_id: params.tenantId,
            client_id: params.clientId,
          },
        },
        { stripeAccount: stripeAccountId },
      );

      payment = this.paymentRepo.create({
        tenant_id: params.tenantId,
        booking_id: params.bookingId,
        quote_id: booking.quote_id,
        client_id: params.clientId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        application_fee_cents: applicationFeeCents,
        currency: currency.toUpperCase(),
        status: 'pending',
        payment_method: 'card',
        payment_mode: 'stripe',
        payment_timing: (tenant.payment_timing ?? 'prepaid') as 'prepaid' | 'postpaid',
        deleted_at: null,
      });
      payment = await this.paymentRepo.save(payment);

      // Link payment to booking
      await this.bookingRepo.update(
        { id: params.bookingId },
        { payment_id: payment.id },
      );
    }

    const publishableKey = process.env.STRIPE_PLATFORM_PUBLISHABLE_KEY ?? '';

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      publishableKey,
      paymentMethods,
    };
  }

  async refundPayment(params: {
    paymentId: string;
    tenantId: string;
    actorId: string;
    amount?: number;
    reason?: string;
  }): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: params.paymentId, tenant_id: params.tenantId, deleted_at: IsNull() },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'succeeded') {
      throw new BadRequestException({
        code: 'PAYMENT_NOT_REFUNDABLE',
        message: 'Only succeeded payments can be refunded',
      });
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: params.tenantId } });
    if (!tenant?.stripe_connect_account_id) {
      throw new BadRequestException('Tenant has no Stripe Connect account');
    }

    const stripe = this.getStripe();
    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.stripe_payment_intent_id ?? undefined,
        amount: params.amount,
        reason: (params.reason ?? 'requested_by_customer') as Stripe.RefundCreateParams.Reason,
      },
      { stripeAccount: tenant.stripe_connect_account_id },
    );

    payment.status = 'refunded';
    payment.refunded_at = new Date();
    const saved = await this.paymentRepo.save(payment);

    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: params.tenantId,
      user_id: params.actorId,
      action: 'payment.refunded',
      resource_type: 'payment',
      resource_id: payment.id,
      old_values: { status: 'succeeded' },
      new_values: { status: 'refunded', refund_id: refund.id },
    }).catch((err) => this.logger.error('Audit log failed for refund', err));

    return saved;
  }

  async listTenantPayments(
    tenantId: string,
    query: { status?: string; page?: number; limit?: number },
  ): Promise<{ items: Payment[]; total: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.paymentRepo.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async sendPaymentLink(paymentId: string, tenantId: string, actorId: string): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, tenant_id: tenantId, deleted_at: IsNull() },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'payment_link.resent',
      resource_type: 'payment',
      resource_id: payment.id,
      old_values: null,
      new_values: { status: payment.status },
    }).catch((err) => this.logger.error('Audit log failed for send-payment-link', err));

    this.logger.log(`Payment link resent for payment ${paymentId} by ${actorId}`);
  }
}

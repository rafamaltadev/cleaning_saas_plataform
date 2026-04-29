import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { InvoiceRepository } from '../infrastructure/invoice.repository';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { InvoiceNumberService } from './invoice-number.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Invoice } from '../domain/invoice.entity';
import { Payment } from '../domain/payment.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { Quote } from '../../quotes/domain/quote.entity';
import { InvoiceResponseDto } from '../domain/invoice-response.dto';
import { PaymentResponseDto } from '../domain/payment-response.dto';
import { CreateInvoiceDto } from '../validation/create-invoice.dto';
import { CreatePaymentDto } from '../validation/create-payment.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { BookingCompletedPayload } from '../../../common/events/domain-events.types';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceNumberService: InvoiceNumberService,
    private readonly domainEventBus: DomainEventBus,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.domainEventBus.on('booking.completed', (p) =>
      void this.handleBookingCompleted(p).catch((err) =>
        this.logger.error('Failed to generate invoice for booking.completed', err),
      ),
    );
  }

  private async handleBookingCompleted(p: BookingCompletedPayload): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: p.bookingId, tenant_id: p.tenantId, deleted_at: IsNull() },
      });
      if (!booking) return;

      const existingInvoice = await manager.findOne(Invoice, {
        where: { booking_id: p.bookingId, tenant_id: p.tenantId, deleted_at: IsNull() },
      });
      if (existingInvoice) return;

      const quote = await manager.findOne(Quote, {
        where: { id: booking.quote_id, tenant_id: p.tenantId, deleted_at: IsNull() },
      });

      const totalCents = quote?.estimated_total_cents ?? 0;
      const currency = quote?.currency ?? 'BRL';

      const invoiceNumber = await this.invoiceNumberService.generate(p.tenantId, manager);
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const invoice = await manager.save(Invoice, {
        tenant_id: p.tenantId,
        booking_id: p.bookingId,
        client_id: booking.client_id,
        total_cents: totalCents,
        currency,
        invoice_number: invoiceNumber,
        issued_at: now,
        due_date: dueDate,
        status: 'issued' as const,
        deleted_at: null,
      });

      const payment = await manager.save(Payment, {
        tenant_id: p.tenantId,
        booking_id: p.bookingId,
        quote_id: booking.quote_id,
        amount_cents: totalCents,
        currency,
        status: 'pending' as const,
        payment_method: 'invoice',
        external_reference: null,
        idempotency_key: `booking-completed-${p.bookingId}`,
        deleted_at: null,
      });

      await manager.save(AuditLog, {
        tenant_id: p.tenantId,
        user_id: p.userId,
        action: 'create',
        resource_type: 'invoice',
        resource_id: invoice.id,
        old_values: null,
        new_values: { invoice_number: invoiceNumber, status: 'issued', total_cents: totalCents },
      });

      await manager.save(AuditLog, {
        tenant_id: p.tenantId,
        user_id: p.userId,
        action: 'create',
        resource_type: 'payment',
        resource_id: payment.id,
        old_values: null,
        new_values: { status: 'pending', amount_cents: totalCents },
      });
    });
  }

  async createInvoice(
    tenantId: string,
    actorId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    let invoice!: Invoice;

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const invoiceNumber = await this.invoiceNumberService.generate(tenantId, manager);

      const saved = await manager.save(Invoice, {
        tenant_id: tenantId,
        booking_id: dto.booking_id,
        client_id: dto.client_id,
        total_cents: dto.total_cents,
        currency: dto.currency,
        invoice_number: invoiceNumber,
        issued_at: new Date(),
        due_date: new Date(dto.due_date),
        status: dto.status ?? ('draft' as const),
        deleted_at: null,
      });

      await manager.save(AuditLog, {
        tenant_id: tenantId,
        user_id: actorId,
        action: 'create',
        resource_type: 'invoice',
        resource_id: saved.id,
        old_values: null,
        new_values: { invoice_number: invoiceNumber, status: saved.status },
      });

      invoice = saved;
    });

    return InvoiceResponseDto.from(invoice);
  }

  async createPayment(
    tenantId: string,
    actorId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const existing = await this.paymentRepository.findByIdempotencyKey(
      dto.idempotency_key,
      tenantId,
    );
    if (existing) {
      return PaymentResponseDto.from(existing);
    }

    let payment!: Payment;

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const existingInTx = await manager.findOne(Payment, {
        where: {
          idempotency_key: dto.idempotency_key,
          tenant_id: tenantId,
          deleted_at: IsNull(),
        },
      });
      if (existingInTx) {
        payment = existingInTx;
        return;
      }

      const saved = await manager.save(Payment, {
        tenant_id: tenantId,
        booking_id: dto.booking_id ?? null,
        quote_id: dto.quote_id ?? null,
        amount_cents: dto.amount_cents,
        currency: dto.currency,
        status: dto.status ?? ('pending' as const),
        payment_method: dto.payment_method,
        external_reference: dto.external_reference ?? null,
        idempotency_key: dto.idempotency_key,
        deleted_at: null,
      });

      await manager.save(AuditLog, {
        tenant_id: tenantId,
        user_id: actorId,
        action: 'create',
        resource_type: 'payment',
        resource_id: saved.id,
        old_values: null,
        new_values: { status: saved.status, amount_cents: saved.amount_cents },
      });

      payment = saved;
    });

    if (payment.status === 'completed') {
      this.domainEventBus.emit('payment.received', {
        paymentId: payment.id,
        tenantId,
        userId: actorId,
        newValues: {
          amount_cents: payment.amount_cents,
          currency: payment.currency,
          status: 'completed',
        },
      });
    }

    return PaymentResponseDto.from(payment);
  }

  async findAllInvoices(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<InvoiceResponseDto>> {
    const result = await this.invoiceRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(InvoiceResponseDto.from),
      meta: result.meta,
    };
  }
}

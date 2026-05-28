import { BillingService } from './billing.service';
import { InvoiceRepository } from '../infrastructure/invoice.repository';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { InvoiceNumberService } from './invoice-number.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { DataSource } from 'typeorm';
import { Invoice } from '../domain/invoice.entity';
import { Payment } from '../domain/payment.entity';
import { InvoiceResponseDto } from '../domain/invoice-response.dto';
import { PaymentResponseDto } from '../domain/payment-response.dto';
import { Booking } from '../../bookings/domain/booking.entity';
import { Quote } from '../../quotes/domain/quote.entity';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-uuid',
    tenant_id: 'tenant-uuid',
    booking_id: 'booking-uuid',
    client_id: 'client-uuid',
    total_cents: 5000,
    currency: 'BRL',
    invoice_number: 'INV-0001',
    issued_at: new Date(),
    due_date: new Date(),
    status: 'issued',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Invoice;
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay-uuid',
    tenant_id: 'tenant-uuid',
    booking_id: 'booking-uuid',
    quote_id: 'quote-uuid',
    client_id: null,
    stripe_payment_intent_id: null,
    stripe_charge_id: null,
    amount_cents: 5000,
    application_fee_cents: 0,
    stripe_fee_cents: null,
    net_amount_cents: null,
    currency: 'BRL',
    status: 'pending',
    payment_method: 'invoice',
    payment_mode: 'manual',
    payment_timing: 'prepaid',
    external_reference: null,
    idempotency_key: 'idem-key-123',
    paid_at: null,
    refunded_at: null,
    failure_reason: null,
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Payment;
}

function makeBooking(): Booking {
  return {
    id: 'booking-uuid',
    tenant_id: 'tenant-uuid',
    quote_id: 'quote-uuid',
    client_id: 'client-uuid',
    service_id: 'service-uuid',
    scheduled_start: new Date(),
    scheduled_end: new Date(),
    status: 'completed',
    assigned_team: null,
    idempotency_key: 'booking-idem-key',
    service_address: null,
    use_client_address: true,
    observations: null,
    origin: 'internal',
    approval_required: false,
    payment_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  } as Booking;
}

function makeQuote(): Quote {
  return {
    id: 'quote-uuid',
    tenant_id: 'tenant-uuid',
    client_id: 'client-uuid',
    service_id: 'service-uuid',
    pricing_rule_id: null,
    status: 'accepted',
    estimated_total_cents: 5000,
    currency: 'BRL',
    valid_until: new Date(),
    manual_discount_percent: 0,
    created_by: 'user-uuid',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  } as Quote;
}

describe('BillingService', () => {
  let service: BillingService;
  let invoiceRepoMock: jest.Mocked<Pick<InvoiceRepository, 'findPaginated'>>;
  let paymentRepoMock: jest.Mocked<Pick<PaymentRepository, 'findByIdempotencyKey' | 'findPaginated'>>;
  let invoiceNumberServiceMock: jest.Mocked<Pick<InvoiceNumberService, 'generate'>>;
  let bus: DomainEventBus;
  let mockManager: { findOne: jest.Mock; save: jest.Mock; query: jest.Mock };
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(() => {
    invoiceRepoMock = { findPaginated: jest.fn() };
    paymentRepoMock = {
      findByIdempotencyKey: jest.fn(),
      findPaginated: jest.fn(),
    };
    invoiceNumberServiceMock = { generate: jest.fn().mockResolvedValue('INV-0001') };
    bus = new DomainEventBus();
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn: (m: typeof mockManager) => Promise<void>) => fn(mockManager)),
    };

    service = new BillingService(
      invoiceRepoMock as unknown as InvoiceRepository,
      paymentRepoMock as unknown as PaymentRepository,
      invoiceNumberServiceMock as unknown as InvoiceNumberService,
      bus,
      dataSourceMock as unknown as DataSource,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    bus.onModuleDestroy();
  });

  // ─── createPayment — idempotency ───────────────────────────────────────────

  describe('createPayment() — idempotency', () => {
    it('returns original payment response without inserting when idempotency_key already exists', async () => {
      const existing = makePayment({ id: 'existing-pay' });
      paymentRepoMock.findByIdempotencyKey.mockResolvedValue(existing);

      const result = await service.createPayment('tenant-uuid', 'actor-uuid', {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'idem-key-123',
      });

      expect(result).toBeInstanceOf(PaymentResponseDto);
      expect(result.id).toBe('existing-pay');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('creates a new payment when idempotency_key is not found', async () => {
      paymentRepoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne.mockResolvedValue(null);
      const saved = makePayment({ id: 'new-pay' });
      mockManager.save.mockResolvedValueOnce(saved).mockResolvedValue({});

      const result = await service.createPayment('tenant-uuid', 'actor-uuid', {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'new-key',
      });

      expect(result.id).toBe('new-pay');
      expect(dataSourceMock.transaction).toHaveBeenCalled();
    });

    it('returns original response when same key found inside transaction (double-check)', async () => {
      paymentRepoMock.findByIdempotencyKey.mockResolvedValue(null);
      const inTx = makePayment({ id: 'in-tx-pay' });
      mockManager.findOne.mockResolvedValue(inTx);

      const result = await service.createPayment('tenant-uuid', 'actor-uuid', {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'idem-key-123',
      });

      expect(result.id).toBe('in-tx-pay');
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  // ─── payment.received event ─────────────────────────────────────────────────

  describe('createPayment() — payment.received event', () => {
    it('emits payment.received event when status is completed', async () => {
      paymentRepoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne.mockResolvedValue(null);
      const saved = makePayment({ id: 'pay-completed', status: 'completed' });
      mockManager.save.mockResolvedValueOnce(saved).mockResolvedValue({});

      const emitSpy = jest.spyOn(bus, 'emit');

      await service.createPayment('tenant-uuid', 'actor-uuid', {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        status: 'completed',
        idempotency_key: 'completed-key',
      });

      expect(emitSpy).toHaveBeenCalledWith(
        'payment.received',
        expect.objectContaining({
          paymentId: 'pay-completed',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          newValues: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });

    it('does NOT emit payment.received when status is pending', async () => {
      paymentRepoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne.mockResolvedValue(null);
      const saved = makePayment({ status: 'pending' });
      mockManager.save.mockResolvedValueOnce(saved).mockResolvedValue({});

      const emitSpy = jest.spyOn(bus, 'emit');

      await service.createPayment('tenant-uuid', 'actor-uuid', {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'pending-key',
      });

      expect(emitSpy).not.toHaveBeenCalledWith('payment.received', expect.anything());
    });
  });

  // ─── booking.completed event subscription ──────────────────────────────────

  describe('booking.completed event subscription', () => {
    it('generates an invoice for the correct tenant when booking.completed fires', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(makeBooking())   // Booking lookup
        .mockResolvedValueOnce(null)            // existing invoice check
        .mockResolvedValueOnce(makeQuote());    // Quote lookup
      mockManager.save
        .mockResolvedValueOnce(makeInvoice())  // Invoice
        .mockResolvedValueOnce(makePayment())  // Payment
        .mockResolvedValue({});                // AuditLog entries

      bus.emit('booking.completed', {
        bookingId: 'booking-uuid',
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        oldValues: { status: 'confirmed' },
        newValues: { status: 'completed' },
      });

      await new Promise((r) => setImmediate(r));

      expect(dataSourceMock.transaction).toHaveBeenCalled();
      expect(invoiceNumberServiceMock.generate).toHaveBeenCalledWith(
        'tenant-uuid',
        mockManager,
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({ tenant_id: 'tenant-uuid', booking_id: 'booking-uuid' }),
      );
    });

    it('skips invoice generation when booking is not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      bus.emit('booking.completed', {
        bookingId: 'ghost-booking',
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        oldValues: {},
        newValues: {},
      });

      await new Promise((r) => setImmediate(r));

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('skips invoice generation when invoice already exists for the booking (idempotent)', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(makeBooking())       // Booking found
        .mockResolvedValueOnce(makeInvoice());      // Existing invoice found

      bus.emit('booking.completed', {
        bookingId: 'booking-uuid',
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        oldValues: {},
        newValues: {},
      });

      await new Promise((r) => setImmediate(r));

      expect(invoiceNumberServiceMock.generate).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  // ─── createInvoice ─────────────────────────────────────────────────────────

  describe('createInvoice()', () => {
    it('creates an invoice with auto-generated invoice_number and returns DTO', async () => {
      const saved = makeInvoice({ id: 'new-inv' });
      mockManager.save.mockResolvedValueOnce(saved).mockResolvedValue({});

      const result = await service.createInvoice('tenant-uuid', 'actor-uuid', {
        booking_id: 'booking-uuid',
        client_id: 'client-uuid',
        total_cents: 5000,
        currency: 'BRL',
        due_date: '2026-12-31T00:00:00Z',
      });

      expect(result).toBeInstanceOf(InvoiceResponseDto);
      expect(result.id).toBe('new-inv');
      expect(invoiceNumberServiceMock.generate).toHaveBeenCalledWith('tenant-uuid', mockManager);
    });
  });

  // ─── findAllInvoices ───────────────────────────────────────────────────────

  describe('findAllInvoices()', () => {
    it('returns paginated invoice list scoped to tenant', async () => {
      invoiceRepoMock.findPaginated.mockResolvedValue({
        items: [makeInvoice()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAllInvoices('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(InvoiceResponseDto);
      expect(result.meta.total).toBe(1);
    });
  });
});

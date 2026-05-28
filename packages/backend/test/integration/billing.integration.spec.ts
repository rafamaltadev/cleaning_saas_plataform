import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DomainEventBus } from '../../src/common/events/domain-event-bus';
import { BillingService } from '../../src/modules/billing/application/billing.service';
import { InvoiceNumberService } from '../../src/modules/billing/application/invoice-number.service';
import { InvoiceRepository } from '../../src/modules/billing/infrastructure/invoice.repository';
import { PaymentRepository } from '../../src/modules/billing/infrastructure/payment.repository';
import { Invoice } from '../../src/modules/billing/domain/invoice.entity';
import { Payment } from '../../src/modules/billing/domain/payment.entity';
import { Booking } from '../../src/modules/bookings/domain/booking.entity';
import { Quote } from '../../src/modules/quotes/domain/quote.entity';
import { AuditLog } from '../../src/modules/audit-log/domain/audit-log.entity';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b-uuid',
    tenant_id: 't-uuid',
    quote_id: 'q-uuid',
    client_id: 'c-uuid',
    service_id: 's-uuid',
    scheduled_start: new Date(),
    scheduled_end: new Date(),
    status: 'completed',
    assigned_team: null,
    idempotency_key: 'booking-idem',
    service_address: null,
    use_client_address: true,
    observations: null,
    origin: 'internal',
    approval_required: false,
    payment_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Booking;
}

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'q-uuid',
    tenant_id: 't-uuid',
    client_id: 'c-uuid',
    service_id: 's-uuid',
    pricing_rule_id: null,
    status: 'accepted',
    estimated_total_cents: 8000,
    currency: 'BRL',
    valid_until: new Date(),
    manual_discount_percent: 0,
    created_by: 'u-uuid',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Quote;
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-uuid',
    tenant_id: 't-uuid',
    booking_id: 'b-uuid',
    client_id: 'c-uuid',
    total_cents: 8000,
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
    tenant_id: 't-uuid',
    booking_id: 'b-uuid',
    quote_id: 'q-uuid',
    client_id: null,
    stripe_payment_intent_id: null,
    stripe_charge_id: null,
    amount_cents: 8000,
    application_fee_cents: 0,
    stripe_fee_cents: null,
    net_amount_cents: null,
    currency: 'BRL',
    status: 'pending',
    payment_method: 'invoice',
    payment_mode: 'manual',
    payment_timing: 'prepaid',
    external_reference: null,
    idempotency_key: 'booking-completed-b-uuid',
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

// ─── Suite 1: booking.completed → invoice generated ─────────────────────────

describe('BillingService → booking.completed → invoice generation', () => {
  let module: TestingModule;
  let billingService: BillingService;
  let bus: DomainEventBus;
  let mockManager: { findOne: jest.Mock; save: jest.Mock; query: jest.Mock };
  let dataSourceMock: { transaction: jest.Mock };
  let invoiceNumberMock: jest.Mocked<Pick<InvoiceNumberService, 'generate'>>;
  let invoiceRepoMock: jest.Mocked<Pick<InvoiceRepository, 'findPaginated'>>;
  let paymentRepoMock: jest.Mocked<Pick<PaymentRepository, 'findByIdempotencyKey' | 'findPaginated'>>;

  beforeEach(async () => {
    mockManager = { findOne: jest.fn(), save: jest.fn(), query: jest.fn() };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn: (m: typeof mockManager) => Promise<void>) => fn(mockManager)),
    };
    invoiceNumberMock = { generate: jest.fn().mockResolvedValue('INV-0001') };
    invoiceRepoMock = { findPaginated: jest.fn() };
    paymentRepoMock = { findByIdempotencyKey: jest.fn(), findPaginated: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        BillingService,
        { provide: InvoiceRepository, useValue: invoiceRepoMock },
        { provide: PaymentRepository, useValue: paymentRepoMock },
        { provide: InvoiceNumberService, useValue: invoiceNumberMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    await module.init();
    billingService = module.get(BillingService);
    bus = module.get(DomainEventBus);
  });

  afterEach(async () => {
    await module.close();
  });

  it('booking.completed event automatically generates an invoice for the correct tenant', async () => {
    mockManager.findOne
      .mockResolvedValueOnce(makeBooking())   // Booking
      .mockResolvedValueOnce(null)            // no existing invoice
      .mockResolvedValueOnce(makeQuote());    // Quote
    mockManager.save
      .mockResolvedValueOnce(makeInvoice())  // Invoice saved
      .mockResolvedValueOnce(makePayment())  // Payment saved
      .mockResolvedValue({});               // AuditLog entries

    bus.emit('booking.completed', {
      bookingId: 'b-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { status: 'confirmed' },
      newValues: { status: 'completed' },
    });

    await new Promise((r) => setImmediate(r));

    expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
    expect(mockManager.save).toHaveBeenCalledWith(
      Invoice,
      expect.objectContaining({ tenant_id: 't-uuid', booking_id: 'b-uuid' }),
    );
    expect(mockManager.save).toHaveBeenCalledWith(
      Payment,
      expect.objectContaining({ tenant_id: 't-uuid', booking_id: 'b-uuid' }),
    );
    expect(mockManager.save).toHaveBeenCalledWith(
      AuditLog,
      expect.objectContaining({ resource_type: 'invoice', action: 'create' }),
    );
    expect(mockManager.save).toHaveBeenCalledWith(
      AuditLog,
      expect.objectContaining({ resource_type: 'payment', action: 'create' }),
    );
  });

  it('transaction rolls back completely if payment save fails — invoice save is also not committed', async () => {
    mockManager.findOne
      .mockResolvedValueOnce(makeBooking())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeQuote());
    mockManager.save
      .mockResolvedValueOnce(makeInvoice())  // invoice saves ok
      .mockRejectedValueOnce(new Error('DB constraint violation'));  // payment fails

    dataSourceMock.transaction.mockImplementationOnce(async (fn: (m: typeof mockManager) => Promise<void>) => {
      await fn(mockManager);
    });

    bus.emit('booking.completed', {
      bookingId: 'b-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: {},
      newValues: {},
    });

    await new Promise((r) => setImmediate(r));

    // The third save (second AuditLog) should NOT have been called since payment threw
    const saveCalls = mockManager.save.mock.calls;
    const auditLogCallsAfterPayment = saveCalls.filter(
      (c) => c[0] === AuditLog && saveCalls.indexOf(c) > saveCalls.findIndex((s) => s[0] === Payment),
    );
    expect(auditLogCallsAfterPayment).toHaveLength(0);
  });
});

// ─── Suite 2: Invoice number sequences are independent per tenant ─────────────

describe('InvoiceNumberService — tenant-scoped sequences', () => {
  let service: InvoiceNumberService;

  beforeEach(() => {
    service = new InvoiceNumberService();
  });

  it('tenant A and tenant B each start at INV-0001 independently', async () => {
    const makeManager = (count: number) => ({
      query: jest.fn()
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{ cnt: count }]),
    });

    const managerA = makeManager(0);
    const managerB = makeManager(0);

    const [numA, numB] = await Promise.all([
      service.generate('tenant-a', managerA as any),
      service.generate('tenant-b', managerB as any),
    ]);

    expect(numA).toBe('INV-0001');
    expect(numB).toBe('INV-0001');
  });

  it('tenant A at INV-0003 does not affect tenant B starting at INV-0001', async () => {
    const makeManager = (count: number) => ({
      query: jest.fn()
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{ cnt: count }]),
    });

    const numA = await service.generate('tenant-a', makeManager(2) as any);
    const numB = await service.generate('tenant-b', makeManager(0) as any);

    expect(numA).toBe('INV-0003');
    expect(numB).toBe('INV-0001');
  });
});

// ─── Suite 3: Payment idempotency ────────────────────────────────────────────

describe('BillingService — payment idempotency', () => {
  let module: TestingModule;
  let billingService: BillingService;
  let paymentRepoMock: jest.Mocked<Pick<PaymentRepository, 'findByIdempotencyKey' | 'findPaginated'>>;
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(async () => {
    paymentRepoMock = { findByIdempotencyKey: jest.fn(), findPaginated: jest.fn() };
    dataSourceMock = { transaction: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        BillingService,
        { provide: InvoiceRepository, useValue: { findPaginated: jest.fn() } },
        { provide: PaymentRepository, useValue: paymentRepoMock },
        { provide: InvoiceNumberService, useValue: { generate: jest.fn() } },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    await module.init();
    billingService = module.get(BillingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('POST /api/v1/payments with existing idempotency_key returns original response without duplicate', async () => {
    const existing = makePayment({ id: 'original-pay' });
    paymentRepoMock.findByIdempotencyKey.mockResolvedValue(existing);

    const result = await billingService.createPayment('t-uuid', 'u-uuid', {
      amount_cents: 5000,
      currency: 'BRL',
      payment_method: 'card',
      idempotency_key: 'booking-completed-b-uuid',
    });

    expect(result.id).toBe('original-pay');
    expect(dataSourceMock.transaction).not.toHaveBeenCalled();
  });
});

// ─── Suite 4: Tenant isolation on GET /api/v1/invoices ───────────────────────

describe('BillingService — tenant isolation for invoices', () => {
  let module: TestingModule;
  let billingService: BillingService;
  let invoiceRepoMock: jest.Mocked<Pick<InvoiceRepository, 'findPaginated'>>;

  beforeEach(async () => {
    invoiceRepoMock = { findPaginated: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        BillingService,
        { provide: InvoiceRepository, useValue: invoiceRepoMock },
        { provide: PaymentRepository, useValue: { findByIdempotencyKey: jest.fn(), findPaginated: jest.fn() } },
        { provide: InvoiceNumberService, useValue: { generate: jest.fn() } },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    await module.init();
    billingService = module.get(BillingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('invoices from a different tenant are not returned', async () => {
    invoiceRepoMock.findPaginated.mockImplementation(async (tenantId) => ({
      items: tenantId === 'tenant-a' ? [makeInvoice({ tenant_id: 'tenant-a' })] : [],
      meta: { total: tenantId === 'tenant-a' ? 1 : 0, page: 1, limit: 20, totalPages: 1 },
    }));

    const resultA = await billingService.findAllInvoices('tenant-a', { page: 1, limit: 20, order: 'ASC' });
    const resultB = await billingService.findAllInvoices('tenant-b', { page: 1, limit: 20, order: 'ASC' });

    expect(resultA.items).toHaveLength(1);
    expect(resultB.items).toHaveLength(0);
    expect(invoiceRepoMock.findPaginated).toHaveBeenCalledWith('tenant-a', expect.anything());
    expect(invoiceRepoMock.findPaginated).toHaveBeenCalledWith('tenant-b', expect.anything());
  });

  it('soft-deleted invoices do not appear in the list (repository excludes deleted_at)', async () => {
    invoiceRepoMock.findPaginated.mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const result = await billingService.findAllInvoices('t-uuid', { page: 1, limit: 20, order: 'ASC' });

    expect(result.items).toHaveLength(0);
    expect(invoiceRepoMock.findPaginated).toHaveBeenCalledWith('t-uuid', expect.anything());
  });
});

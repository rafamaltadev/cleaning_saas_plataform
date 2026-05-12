import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { DomainEventBus } from '../../src/common/events/domain-event-bus';
import { AuditLogService } from '../../src/modules/audit-log/application/audit-log.service';
import { AuditLog } from '../../src/modules/audit-log/domain/audit-log.entity';
import { QuoteService } from '../../src/modules/quotes/application/quote.service';
import { QuoteRepository } from '../../src/modules/quotes/infrastructure/quote.repository';
import { ServiceRepository } from '../../src/modules/services/infrastructure/service.repository';
import { PricingRuleRepository } from '../../src/modules/services/infrastructure/pricing-rule.repository';
import { PricingService } from '../../src/modules/services/application/pricing.service';
import { BookingService } from '../../src/modules/bookings/application/booking.service';
import { BookingRepository } from '../../src/modules/bookings/infrastructure/booking.repository';
import { Quote } from '../../src/modules/quotes/domain/quote.entity';
import { Booking } from '../../src/modules/bookings/domain/booking.entity';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeQuoteEntity(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'q-uuid',
    tenant_id: 't-uuid',
    client_id: 'c-uuid',
    service_id: 's-uuid',
    pricing_rule_id: null,
    status: 'draft',
    estimated_total_cents: 1000,
    currency: 'BRL',
    valid_until: new Date(Date.now() + 86400000),
    manual_discount_percent: 0,
    created_by: 'u-uuid',
    service_address: null,
    use_client_address: true,
    observations: null,
    area_sqm: null,
    service_date: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

function makeBookingEntity(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b-uuid',
    tenant_id: 't-uuid',
    quote_id: 'q-uuid',
    client_id: 'c-uuid',
    service_id: 's-uuid',
    scheduled_start: new Date('2026-06-01T09:00:00Z'),
    scheduled_end: new Date('2026-06-01T11:00:00Z'),
    status: 'confirmed',
    assigned_team: null,
    idempotency_key: 'idem-key',
    service_address: null,
    use_client_address: true,
    observations: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Suite 1 — Bus ➜ AuditLogService direct integration
// ──────────────────────────────────────────────────────────────────────────────

describe('DomainEventBus → AuditLogService integration', () => {
  let module: TestingModule;
  let bus: DomainEventBus;
  let auditSaveMock: jest.Mock;

  beforeEach(async () => {
    auditSaveMock = jest.fn().mockResolvedValue({});

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: { save: auditSaveMock },
        },
      ],
    }).compile();

    await module.init();
    bus = module.get(DomainEventBus);
  });

  afterEach(async () => {
    await module.close();
  });

  it('quote.created writes an audit entry with all required fields', () => {
    bus.emit('quote.created', {
      quoteId: 'q-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      newValues: { status: 'draft', estimated_total_cents: 2000 },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'create',
        resource_type: 'quote',
        resource_id: 'q-uuid',
        old_values: null,
        new_values: expect.objectContaining({ status: 'draft' }),
      }),
    );
  });

  it('quote.sent writes an audit entry with all required fields', () => {
    bus.emit('quote.sent', {
      quoteId: 'q-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { status: 'draft' },
      newValues: { status: 'sent' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'send',
        resource_type: 'quote',
        resource_id: 'q-uuid',
        old_values: { status: 'draft' },
        new_values: { status: 'sent' },
      }),
    );
  });

  it('quote.accepted writes an audit entry with all required fields', () => {
    bus.emit('quote.accepted', {
      quoteId: 'q-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { status: 'sent' },
      newValues: { status: 'accepted' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'accept',
        resource_type: 'quote',
        resource_id: 'q-uuid',
      }),
    );
  });

  it('quote.expired writes an audit entry with all required fields', () => {
    bus.emit('quote.expired', {
      quoteId: 'q-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { status: 'sent' },
      newValues: { status: 'expired' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'expire',
        resource_type: 'quote',
        resource_id: 'q-uuid',
      }),
    );
  });

  it('booking.confirmed writes an audit entry with all required fields', () => {
    bus.emit('booking.confirmed', {
      bookingId: 'b-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { quote_status: 'sent' },
      newValues: { status: 'confirmed', quote_status: 'accepted' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'confirm',
        resource_type: 'booking',
        resource_id: 'b-uuid',
        new_values: expect.objectContaining({ status: 'confirmed' }),
      }),
    );
  });

  it('booking.completed writes an audit entry with all required fields', () => {
    bus.emit('booking.completed', {
      bookingId: 'b-uuid',
      tenantId: 't-uuid',
      userId: 'u-uuid',
      oldValues: { status: 'confirmed' },
      newValues: { status: 'completed' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'complete',
        resource_type: 'booking',
        resource_id: 'b-uuid',
        old_values: { status: 'confirmed' },
        new_values: { status: 'completed' },
      }),
    );
  });

  it('payment.received writes an audit entry with all required fields', () => {
    bus.emit('payment.received', {
      paymentId: 'pay-uuid',
      tenantId: 't-uuid',
      userId: null,
      newValues: { amount_cents: 5000, currency: 'BRL' },
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'receive',
        resource_type: 'payment',
        resource_id: 'pay-uuid',
        old_values: null,
        new_values: expect.objectContaining({ amount_cents: 5000 }),
      }),
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Suite 2 — QuoteService ➜ Bus ➜ AuditLogService end-to-end
// ──────────────────────────────────────────────────────────────────────────────

describe('QuoteService → Bus → AuditLogService integration', () => {
  let module: TestingModule;
  let quoteService: QuoteService;
  let auditSaveMock: jest.Mock;
  let quoteRepoSaveMock: jest.Mock;
  let quoteRepoFindMock: jest.Mock;
  let serviceRepoFindMock: jest.Mock;
  let mockManager: { save: jest.Mock };
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(async () => {
    auditSaveMock = jest.fn().mockResolvedValue({});
    quoteRepoSaveMock = jest.fn().mockResolvedValue(makeQuoteEntity());
    quoteRepoFindMock = jest.fn().mockResolvedValue(makeQuoteEntity({ status: 'draft' }));
    serviceRepoFindMock = jest.fn().mockResolvedValue({
      id: 's-uuid',
      unit: 'flat',
      base_rate_cents: 1000,
      tenant_id: 't-uuid',
    });
    mockManager = { save: jest.fn().mockResolvedValue(undefined) };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn: (m: typeof mockManager) => Promise<void>) => fn(mockManager)),
    };

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: { save: auditSaveMock },
        },
        QuoteService,
        {
          provide: QuoteRepository,
          useValue: {
            save: quoteRepoSaveMock,
            findById: quoteRepoFindMock,
            findPaginated: jest.fn(),
          },
        },
        {
          provide: ServiceRepository,
          useValue: { findById: serviceRepoFindMock },
        },
        {
          provide: PricingRuleRepository,
          useValue: { findById: jest.fn() },
        },
        {
          provide: PricingService,
          useValue: { calculate: jest.fn().mockReturnValue(1000) },
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    await module.init();
    quoteService = module.get(QuoteService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('QuoteService.create() triggers AuditLogService and produces a correct audit entry', async () => {
    quoteRepoSaveMock.mockResolvedValue(makeQuoteEntity({ id: 'new-q', status: 'draft', estimated_total_cents: 1000 }));

    await quoteService.create('t-uuid', 'u-uuid', {
      client_id: 'c-uuid',
      service_id: 's-uuid',
      currency: 'BRL',
      valid_until: '2026-12-31T00:00:00.000Z',
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'create',
        resource_type: 'quote',
        resource_id: 'new-q',
        old_values: null,
        new_values: expect.objectContaining({ status: 'draft' }),
      }),
    );
  });

  it('quote.sent event emitted from QuoteService.send() is received by AuditLogService and produces a correct log entry', async () => {
    quoteRepoFindMock.mockResolvedValue(makeQuoteEntity({ id: 'q-uuid', status: 'draft' }));

    await quoteService.send('q-uuid', 't-uuid', 'u-uuid', ['quotes.send']);

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'send',
        resource_type: 'quote',
        resource_id: 'q-uuid',
        old_values: { status: 'draft' },
        new_values: { status: 'sent' },
      }),
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Suite 3 — BookingService ➜ Bus ➜ AuditLogService end-to-end
// ──────────────────────────────────────────────────────────────────────────────

describe('BookingService → Bus → AuditLogService integration', () => {
  let module: TestingModule;
  let bookingService: BookingService;
  let auditSaveMock: jest.Mock;
  let bookingRepoFindByIdMock: jest.Mock;
  let bookingRepoSaveMock: jest.Mock;
  let mockManager: { findOne: jest.Mock; save: jest.Mock };
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(async () => {
    auditSaveMock = jest.fn().mockResolvedValue({});
    bookingRepoFindByIdMock = jest.fn().mockResolvedValue(makeBookingEntity());
    bookingRepoSaveMock = jest.fn().mockResolvedValue(makeBookingEntity());
    mockManager = { findOne: jest.fn(), save: jest.fn() };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn: (m: typeof mockManager) => Promise<void>) => fn(mockManager)),
    };

    module = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: { save: auditSaveMock },
        },
        BookingService,
        {
          provide: BookingRepository,
          useValue: {
            findByIdempotencyKey: jest.fn().mockResolvedValue(null),
            findById: bookingRepoFindByIdMock,
            findPaginated: jest.fn(),
            save: bookingRepoSaveMock,
          },
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    await module.init();
    bookingService = module.get(BookingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('booking.confirmed event emitted from BookingService.create() is received by AuditLogService and produces a correct log entry', async () => {
    mockManager.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'q-uuid', status: 'sent', tenant_id: 't-uuid', deleted_at: null });
    mockManager.save
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(makeBookingEntity({ id: 'b-uuid' }));

    await bookingService.create('t-uuid', 'u-uuid', {
      quote_id: 'q-uuid',
      client_id: 'c-uuid',
      service_id: 's-uuid',
      scheduled_start: '2026-06-01T09:00:00Z',
      scheduled_end: '2026-06-01T11:00:00Z',
      idempotency_key: 'idem-key',
    });

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'confirm',
        resource_type: 'booking',
        resource_id: 'b-uuid',
        new_values: expect.objectContaining({ status: 'confirmed' }),
      }),
    );
  });

  it('booking.completed event emitted from BookingService.complete() produces a correct audit log entry', async () => {
    bookingRepoFindByIdMock.mockResolvedValue(makeBookingEntity({ status: 'confirmed' }));
    bookingRepoSaveMock.mockResolvedValue(makeBookingEntity({ status: 'completed' }));

    await bookingService.complete('b-uuid', 't-uuid', 'u-uuid');

    expect(auditSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 't-uuid',
        user_id: 'u-uuid',
        action: 'complete',
        resource_type: 'booking',
        resource_id: 'b-uuid',
        old_values: { status: 'confirmed' },
        new_values: { status: 'completed' },
      }),
    );
  });
});

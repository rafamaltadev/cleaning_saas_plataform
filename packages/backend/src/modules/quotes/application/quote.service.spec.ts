import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteRepository } from '../infrastructure/quote.repository';
import { ServiceRepository } from '../../services/infrastructure/service.repository';
import { PricingRuleRepository } from '../../services/infrastructure/pricing-rule.repository';
import { PricingService } from '../../services/application/pricing.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Quote } from '../domain/quote.entity';
import { QuoteResponseDto } from '../domain/quote-response.dto';
import { Service } from '../../services/domain/service.entity';
import { DataSource } from 'typeorm';

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Service',
    description: 'Desc',
    base_rate_cents: 1000,
    unit: 'flat',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-uuid',
    tenant_id: 'tenant-uuid',
    client_id: 'client-uuid',
    service_id: 'service-uuid',
    pricing_rule_id: null,
    status: 'draft',
    estimated_total_cents: 1000,
    currency: 'BRL',
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    manual_discount_percent: 0,
    created_by: 'actor-uuid',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('QuoteService', () => {
  let service: QuoteService;
  let quoteRepoMock: jest.Mocked<Pick<QuoteRepository, 'findById' | 'findPaginated' | 'save'>>;
  let serviceRepoMock: jest.Mocked<Pick<ServiceRepository, 'findById'>>;
  let pricingRuleRepoMock: jest.Mocked<Pick<PricingRuleRepository, 'findById'>>;
  let pricingServiceMock: jest.Mocked<Pick<PricingService, 'calculate'>>;
  let eventBusMock: jest.Mocked<Pick<DomainEventBus, 'emit'>>;
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(() => {
    const mockManager = { save: jest.fn().mockResolvedValue(undefined) };

    quoteRepoMock = {
      findById: jest.fn(),
      findPaginated: jest.fn(),
      save: jest.fn(),
    };
    serviceRepoMock = { findById: jest.fn() };
    pricingRuleRepoMock = { findById: jest.fn() };
    pricingServiceMock = { calculate: jest.fn() };
    eventBusMock = { emit: jest.fn() };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn: (m: typeof mockManager) => Promise<void>) => {
        await fn(mockManager);
      }),
    };

    service = new QuoteService(
      quoteRepoMock as unknown as QuoteRepository,
      serviceRepoMock as unknown as ServiceRepository,
      pricingRuleRepoMock as unknown as PricingRuleRepository,
      pricingServiceMock as unknown as PricingService,
      eventBusMock as unknown as DomainEventBus,
      dataSourceMock as unknown as DataSource,
    );
  });

  describe('create()', () => {
    const dto = {
      client_id: 'client-uuid',
      service_id: 'service-uuid',
      currency: 'BRL',
      valid_until: '2026-12-31T00:00:00.000Z',
    };

    it('delegates price calculation to PricingService.calculate() and stores result', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService({ unit: 'flat' }));
      pricingServiceMock.calculate.mockReturnValue(2500);
      quoteRepoMock.save.mockResolvedValue(makeQuote({ estimated_total_cents: 2500 }));

      const result = await service.create('tenant-uuid', 'actor-uuid', dto);

      expect(pricingServiceMock.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ unit: 'flat', base_rate_cents: 1000 }),
      );
      expect(result.estimated_total_cents).toBe(2500);
      expect(quoteRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ estimated_total_cents: 2500 }),
      );
    });

    it('calculates sqm price correctly using area_sqm', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService({ unit: 'sqm', base_rate_cents: 100 }));
      pricingServiceMock.calculate.mockReturnValue(5000);
      quoteRepoMock.save.mockResolvedValue(makeQuote({ estimated_total_cents: 5000 }));

      await service.create('tenant-uuid', 'actor', { ...dto, area_sqm: 50 });

      expect(pricingServiceMock.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ unit: 'sqm', area_sqm: 50 }),
      );
    });

    it('throws BadRequestException when service unit is sqm and area_sqm is missing', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService({ unit: 'sqm' }));

      await expect(service.create('tenant-uuid', 'actor', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when service unit is hour and duration_hours is missing', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService({ unit: 'hour' }));

      await expect(service.create('tenant-uuid', 'actor', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when service does not exist', async () => {
      serviceRepoMock.findById.mockResolvedValue(null);

      await expect(service.create('tenant-uuid', 'actor', dto)).rejects.toThrow(NotFoundException);
    });

    it('emits quote.created domain event', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService());
      pricingServiceMock.calculate.mockReturnValue(1000);
      quoteRepoMock.save.mockResolvedValue(makeQuote({ id: 'new-quote' }));

      await service.create('tenant-uuid', 'actor-uuid', dto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.created',
        expect.objectContaining({ quoteId: 'new-quote' }),
      );
    });

    it('emits quote.created with all required audit fields', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService());
      pricingServiceMock.calculate.mockReturnValue(1000);
      quoteRepoMock.save.mockResolvedValue(makeQuote());

      await service.create('tenant-uuid', 'actor-uuid', dto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.created',
        expect.objectContaining({
          quoteId: 'quote-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          newValues: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });

    it('returns QuoteResponseDto without deleted_at', async () => {
      serviceRepoMock.findById.mockResolvedValue(makeService());
      pricingServiceMock.calculate.mockReturnValue(1000);
      quoteRepoMock.save.mockResolvedValue(makeQuote());

      const result = await service.create('tenant-uuid', 'actor-uuid', dto);

      expect(result).toBeInstanceOf(QuoteResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });
  });

  describe('state machine', () => {
    it('draft → sent transition is valid', async () => {
      const quote = makeQuote({ status: 'draft' });
      quoteRepoMock.findById.mockResolvedValue(quote);

      await expect(
        service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']),
      ).resolves.not.toThrow();

      expect(dataSourceMock.transaction).toHaveBeenCalled();
      expect(quote.status).toBe('sent');
    });

    it('sent → accepted transition is valid', async () => {
      const quote = makeQuote({ status: 'sent' });
      quoteRepoMock.findById.mockResolvedValue(quote);

      await expect(
        service.acceptQuote('quote-uuid', 'tenant-uuid', 'actor-uuid'),
      ).resolves.not.toThrow();

      expect(quote.status).toBe('accepted');
    });

    it('accepted → sent transition is invalid and returns HTTP 400', async () => {
      const quote = makeQuote({ status: 'accepted' });
      quoteRepoMock.findById.mockResolvedValue(quote);

      await expect(
        service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']),
      ).rejects.toThrow(BadRequestException);
    });

    it('expired → sent transition is invalid and returns HTTP 400', async () => {
      const quote = makeQuote({ status: 'expired' });
      quoteRepoMock.findById.mockResolvedValue(quote);

      await expect(
        service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejected → sent transition is invalid and returns HTTP 400', async () => {
      const quote = makeQuote({ status: 'rejected' });
      quoteRepoMock.findById.mockResolvedValue(quote);

      await expect(
        service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('send()', () => {
    it('emits quote.sent domain event on success', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'draft' }));

      await service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.sent',
        expect.objectContaining({ quoteId: 'quote-uuid' }),
      );
    });

    it('emits quote.sent with all required audit fields', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'draft' }));

      await service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.sent',
        expect.objectContaining({
          quoteId: 'quote-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          oldValues: { status: 'draft' },
          newValues: { status: 'sent' },
        }),
      );
    });

    it('wraps status update in a database transaction', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'draft' }));

      await service.send('quote-uuid', 'tenant-uuid', 'actor-uuid', ['quotes.send']);

      expect(dataSourceMock.transaction).toHaveBeenCalled();
    });
  });

  describe('acceptQuote()', () => {
    it('emits quote.accepted domain event', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'sent' }));

      await service.acceptQuote('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.accepted',
        expect.objectContaining({ quoteId: 'quote-uuid' }),
      );
    });

    it('emits quote.accepted with all required audit fields', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'sent' }));

      await service.acceptQuote('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.accepted',
        expect.objectContaining({
          quoteId: 'quote-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          oldValues: { status: 'sent' },
          newValues: { status: 'accepted' },
        }),
      );
    });

    it('throws NotFoundException when quote does not exist', async () => {
      quoteRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.acceptQuote('missing', 'tenant-uuid', 'actor-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('lazy expiration (findById)', () => {
    it('a sent quote with valid_until in the past returns with status expired after GET', async () => {
      const expiredQuote = makeQuote({
        status: 'sent',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(expiredQuote);

      const result = await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(result.status).toBe('expired');
      expect(dataSourceMock.transaction).toHaveBeenCalled();
    });

    it('emits quote.expired domain event during lazy expiration', async () => {
      const expiredQuote = makeQuote({
        status: 'sent',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(expiredQuote);

      await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.expired',
        expect.objectContaining({ quoteId: 'quote-uuid' }),
      );
    });

    it('emits quote.expired with all required audit fields', async () => {
      const expiredQuote = makeQuote({
        status: 'sent',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(expiredQuote);

      await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.expired',
        expect.objectContaining({
          quoteId: 'quote-uuid',
          userId: 'actor-uuid',
          oldValues: { status: 'sent' },
          newValues: { status: 'expired' },
        }),
      );
    });

    it('draft quotes with valid_until in the past are NOT changed to expired', async () => {
      const draftQuote = makeQuote({
        status: 'draft',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(draftQuote);

      const result = await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(result.status).toBe('draft');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('accepted quotes with valid_until in the past do NOT change status', async () => {
      const acceptedQuote = makeQuote({
        status: 'accepted',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(acceptedQuote);

      const result = await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(result.status).toBe('accepted');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('rejected quotes with valid_until in the past do NOT change status', async () => {
      const rejectedQuote = makeQuote({
        status: 'rejected',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findById.mockResolvedValue(rejectedQuote);

      const result = await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(result.status).toBe('rejected');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('sent quote with valid_until in the future is NOT expired', async () => {
      const futureQuote = makeQuote({
        status: 'sent',
        valid_until: new Date(Date.now() + 1000 * 60 * 60),
      });
      quoteRepoMock.findById.mockResolvedValue(futureQuote);

      const result = await service.findById('quote-uuid', 'tenant-uuid', 'actor-uuid');

      expect(result.status).toBe('sent');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when quote does not exist', async () => {
      quoteRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.findById('missing', 'tenant-uuid', 'actor-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('lazy expiration (findAll)', () => {
    it('expires sent quotes with valid_until in past during list call', async () => {
      const expiredQuote = makeQuote({
        status: 'sent',
        valid_until: new Date(Date.now() - 1000),
      });
      quoteRepoMock.findPaginated.mockResolvedValue({
        items: [expiredQuote],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', 'actor-uuid', {
        page: 1,
        limit: 20,
        order: 'ASC',
      });

      expect(result.items[0].status).toBe('expired');
      expect(dataSourceMock.transaction).toHaveBeenCalled();
    });

    it('returns correct pagination meta', async () => {
      quoteRepoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 50, page: 2, limit: 10, totalPages: 5 },
      });

      const result = await service.findAll('tenant-uuid', 'actor-uuid', {
        page: 2,
        limit: 10,
        order: 'ASC',
      });

      expect(result.meta).toEqual({ total: 50, page: 2, limit: 10, totalPages: 5 });
    });

    it('uses tenantId to scope query (cross-tenant isolation)', async () => {
      quoteRepoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.findAll('tenant-A', 'actor', { page: 1, limit: 20, order: 'ASC' });

      expect(quoteRepoMock.findPaginated).toHaveBeenCalledWith('tenant-A', expect.any(Object));
    });
  });

  describe('update()', () => {
    it('updates manual_discount_percent', async () => {
      const quote = makeQuote({ status: 'draft' });
      quoteRepoMock.findById.mockResolvedValue(quote);
      quoteRepoMock.save.mockResolvedValue({ ...quote, manual_discount_percent: 10 });

      const result = await service.update('quote-uuid', 'tenant-uuid', 'actor', {
        manual_discount_percent: 10,
      });

      expect(result).toBeInstanceOf(QuoteResponseDto);
      expect(result.manual_discount_percent).toBe(10);
    });

    it('rejects invalid status transition via update', async () => {
      quoteRepoMock.findById.mockResolvedValue(makeQuote({ status: 'draft' }));

      await expect(
        service.update('quote-uuid', 'tenant-uuid', 'actor', { status: 'rejected' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows sent → rejected via update', async () => {
      const quote = makeQuote({ status: 'sent' });
      quoteRepoMock.findById.mockResolvedValue(quote);
      quoteRepoMock.save.mockResolvedValue({ ...quote, status: 'rejected' });

      const result = await service.update('quote-uuid', 'tenant-uuid', 'actor', {
        status: 'rejected',
      });

      expect(result.status).toBe('rejected');
    });

    it('throws NotFoundException when quote does not exist', async () => {
      quoteRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', 'tenant-uuid', 'actor', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById() cross-tenant isolation', () => {
    it('returns NotFoundException when quote belongs to a different tenant', async () => {
      quoteRepoMock.findById.mockResolvedValue(null);

      await expect(
        service.findById('quote-uuid', 'other-tenant', 'actor'),
      ).rejects.toThrow(NotFoundException);

      expect(quoteRepoMock.findById).toHaveBeenCalledWith('quote-uuid', 'other-tenant');
    });
  });
});

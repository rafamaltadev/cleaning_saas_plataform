import { NotFoundException } from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { PricingRuleRepository } from '../infrastructure/pricing-rule.repository';
import { PricingRule } from '../domain/pricing-rule.entity';
import { PricingRuleResponseDto } from '../domain/pricing-rule-response.dto';

function makeRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'rule-uuid',
    tenant_id: 'tenant-uuid',
    service_id: 'service-uuid',
    min_area: null,
    max_area: null,
    frequency: 'one_time',
    discount_percent: 0,
    price_multiplier: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('PricingRulesService', () => {
  let service: PricingRulesService;
  let repoMock: jest.Mocked<
    Pick<PricingRuleRepository, 'findPaginated' | 'findById' | 'save'>
  >;

  beforeEach(() => {
    repoMock = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    service = new PricingRulesService(repoMock as unknown as PricingRuleRepository);
  });

  describe('findAll', () => {
    it('returns paginated PricingRuleResponseDtos', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeRule()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(PricingRuleResponseDto);
    });

    it('does not expose deleted_at on returned items', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeRule({ deleted_at: new Date() })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items[0]).not.toHaveProperty('deleted_at');
    });

    // Integration scenario: pagination meta is accurate
    it('pagination meta reflects the total returned by repository', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeRule(), makeRule({ id: 'rule-2' })],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });

    it('passes pagination params to repository', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
      });

      await service.findAll('tenant-uuid', { page: 2, limit: 5, order: 'DESC' });

      expect(repoMock.findPaginated).toHaveBeenCalledWith(
        'tenant-uuid',
        { page: 2, limit: 5, order: 'DESC' },
      );
    });
  });

  describe('create', () => {
    const createDto = {
      service_id: 'svc-uuid',
      frequency: 'monthly' as const,
      discount_percent: 10,
      price_multiplier: 1.5,
    };

    it('saves rule with the correct tenant_id', async () => {
      repoMock.save.mockResolvedValue(makeRule());

      await service.create('my-tenant', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'my-tenant' }),
      );
    });

    it('returns PricingRuleResponseDto without deleted_at', async () => {
      repoMock.save.mockResolvedValue(makeRule());

      const result = await service.create('tenant-uuid', createDto);

      expect(result).toBeInstanceOf(PricingRuleResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('defaults min_area and max_area to null when not provided', async () => {
      repoMock.save.mockResolvedValue(makeRule());

      await service.create('tenant-uuid', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ min_area: null, max_area: null }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when rule does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('tenant-uuid', 'missing', { discount_percent: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns PricingRuleResponseDto without deleted_at', async () => {
      repoMock.findById.mockResolvedValue(makeRule());
      repoMock.save.mockResolvedValue(makeRule({ discount_percent: 20 }));

      const result = await service.update('tenant-uuid', 'rule-uuid', { discount_percent: 20 });

      expect(result).toBeInstanceOf(PricingRuleResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('calls findById with ruleId and tenantId for tenant isolation', async () => {
      repoMock.findById.mockResolvedValue(makeRule());
      repoMock.save.mockResolvedValue(makeRule());

      await service.update('tenant-uuid', 'rule-uuid', {});

      expect(repoMock.findById).toHaveBeenCalledWith('rule-uuid', 'tenant-uuid');
    });
  });
});

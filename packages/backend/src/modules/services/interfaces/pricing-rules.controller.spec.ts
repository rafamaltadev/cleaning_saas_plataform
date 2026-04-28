import { PricingRulesController } from './pricing-rules.controller';
import { PricingRulesService } from '../application/pricing-rules.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockPricingRulesService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as PricingRulesService;

function makeRequest(tenantId: string): Request & { user?: AuthUser } {
  return { user: { userId: 'actor-uuid', tenantId, roles: ['supervisor'] } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('PricingRulesController', () => {
  let controller: PricingRulesController;

  beforeEach(() => {
    controller = new PricingRulesController(mockPricingRulesService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('delegates to pricingRulesService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockPricingRulesService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.getAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockPricingRulesService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });

    // Integration scenario: pagination meta is accurate
    it('returns pagination meta from service', async () => {
      const meta = { total: 5, page: 2, limit: 3, totalPages: 2 };
      (mockPricingRulesService.findAll as jest.Mock).mockResolvedValue({ items: [], meta });

      const result = await controller.getAll(
        makeRequest('tenant-uuid'),
        { page: 2, limit: 3, order: 'ASC' },
      );

      expect(result.meta).toEqual(meta);
    });
  });

  describe('create', () => {
    it('delegates to pricingRulesService.create with tenantId and dto', async () => {
      const dto = {
        service_id: 'svc-uuid',
        frequency: 'monthly' as const,
        discount_percent: 10,
        price_multiplier: 1.5,
      };
      const created = { id: 'new-uuid' };
      (mockPricingRulesService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid'), dto as any);

      expect(mockPricingRulesService.create).toHaveBeenCalledWith('tenant-uuid', dto);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to pricingRulesService.update with tenantId, id, and dto', async () => {
      const dto = { discount_percent: 20 };
      const updated = { id: 'rule-uuid', discount_percent: 20 };
      (mockPricingRulesService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(makeRequest('tenant-uuid'), 'rule-uuid', dto as any);

      expect(mockPricingRulesService.update).toHaveBeenCalledWith(
        'tenant-uuid',
        'rule-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });
});

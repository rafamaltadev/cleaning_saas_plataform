import { Repository } from 'typeorm';
import { PricingRuleRepository } from './pricing-rule.repository';
import { PricingRule } from '../domain/pricing-rule.entity';

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getOne: jest.fn().mockResolvedValue(null),
});

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
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('PricingRuleRepository', () => {
  let repo: PricingRuleRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<Pick<Repository<PricingRule>, 'createQueryBuilder' | 'save'>>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new PricingRuleRepository(mockRepository as unknown as Repository<PricingRule>);
  });

  describe('findPaginated (inherited)', () => {
    it('excludes soft-deleted records by default', async () => {
      await repo.findPaginated('tenant-uuid', { page: 1, limit: 10, order: 'ASC' });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity.deleted_at IS NULL');
    });

    it('filters by tenant_id', async () => {
      await repo.findPaginated('my-tenant', { page: 1, limit: 10, order: 'ASC' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'my-tenant' },
      );
    });

    it('applies pagination with skip and take', async () => {
      await repo.findPaginated('tenant-uuid', { page: 3, limit: 10, order: 'ASC' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('findById (inherited)', () => {
    it('scopes by tenant_id', async () => {
      await repo.findById('rule-uuid', 'tenant-uuid');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-uuid' },
      );
    });

    it('filters by id', async () => {
      await repo.findById('rule-uuid', 'tenant-uuid');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'rule-uuid' },
      );
    });

    it('returns null when rule not found', async () => {
      const result = await repo.findById('missing', 'tenant-uuid');
      expect(result).toBeNull();
    });

    it('returns rule when found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(makeRule());
      const result = await repo.findById('rule-uuid', 'tenant-uuid');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('rule-uuid');
    });
  });

  describe('save (inherited)', () => {
    it('persists and returns the entity', async () => {
      const rule = makeRule();
      mockRepository.save.mockResolvedValue(rule);
      const result = await repo.save(rule);
      expect(result).toBe(rule);
    });
  });
});

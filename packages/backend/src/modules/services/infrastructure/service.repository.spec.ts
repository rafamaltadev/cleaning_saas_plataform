import { Repository } from 'typeorm';
import { ServiceRepository } from './service.repository';
import { Service } from '../domain/service.entity';

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

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Service',
    description: 'Test description',
    base_rate_cents: 1000,
    unit: 'flat',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('ServiceRepository', () => {
  let repo: ServiceRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<Pick<Repository<Service>, 'createQueryBuilder' | 'save'>>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new ServiceRepository(mockRepository as unknown as Repository<Service>);
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
      await repo.findPaginated('tenant-uuid', { page: 2, limit: 5, order: 'ASC' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findById (inherited)', () => {
    it('scopes by tenant_id', async () => {
      await repo.findById('service-uuid', 'tenant-uuid');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-uuid' },
      );
    });

    it('filters by id', async () => {
      await repo.findById('service-uuid', 'tenant-uuid');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'service-uuid' },
      );
    });

    it('returns null when service not found', async () => {
      const result = await repo.findById('missing', 'tenant-uuid');
      expect(result).toBeNull();
    });

    it('returns service when found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(makeService());
      const result = await repo.findById('service-uuid', 'tenant-uuid');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('service-uuid');
    });
  });

  describe('save (inherited)', () => {
    it('persists and returns the entity', async () => {
      const svc = makeService();
      mockRepository.save.mockResolvedValue(svc);
      const result = await repo.save(svc);
      expect(result).toBe(svc);
    });
  });
});

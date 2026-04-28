import { Repository } from 'typeorm';
import { TenantScopedRepository } from './tenant-scoped.repository';
import { PaginationQueryDto } from '../dto/pagination.dto';

class TestEntity {
  id: string = '';
  tenant_id: string = '';
  deleted_at: Date | null = null;
  name: string = '';
}

class ConcreteRepository extends TenantScopedRepository<TestEntity> {
  constructor(repo: Repository<TestEntity>) {
    super(repo);
  }
}

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('TenantScopedRepository', () => {
  let repo: ConcreteRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<
    Pick<Repository<TestEntity>, 'createQueryBuilder' | 'save'>
  >;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new ConcreteRepository(
      mockRepository as unknown as Repository<TestEntity>,
    );
  });

  describe('findPaginated', () => {
    it('always filters by tenant_id', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      await repo.findPaginated('tenant-abc', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-abc' },
      );
    });

    it('excludes soft-deleted records by default', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      await repo.findPaginated('tenant-1', query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.deleted_at IS NULL',
      );
    });

    it('applies skip and take for pagination', async () => {
      const query: PaginationQueryDto = { page: 3, limit: 10, order: 'ASC' };
      await repo.findPaginated('tenant-1', query);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('applies orderBy when sort is provided', async () => {
      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        sort: 'created_at',
        order: 'DESC',
      };
      await repo.findPaginated('tenant-1', query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entity.created_at',
        'DESC',
      );
    });

    it('does not call orderBy when sort is not provided', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      await repo.findPaginated('tenant-1', query);

      expect(mockQueryBuilder.orderBy).not.toHaveBeenCalled();
    });

    it('computes totalPages correctly for exact division', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        Array(20).fill({ id: '1', tenant_id: 't', deleted_at: null, name: 'x' }),
        20,
      ]);

      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      const result = await repo.findPaginated('tenant-1', query);

      expect(result.meta.totalPages).toBe(2);
    });

    it('computes totalPages correctly for non-exact division', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 25]);

      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      const result = await repo.findPaginated('tenant-1', query);

      expect(result.meta.totalPages).toBe(3);
    });

    it('returns zero totalPages when total is 0', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const query: PaginationQueryDto = { page: 1, limit: 10, order: 'ASC' };
      const result = await repo.findPaginated('tenant-1', query);

      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.total).toBe(0);
    });

    it('returns correct meta fields', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 45]);

      const query: PaginationQueryDto = { page: 2, limit: 15, order: 'ASC' };
      const result = await repo.findPaginated('tenant-1', query);

      expect(result.meta).toEqual({
        total: 45,
        page: 2,
        limit: 15,
        totalPages: 3,
      });
    });

    it('normalizes lowercase order to uppercase', async () => {
      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        sort: 'name',
        order: 'asc',
      };
      await repo.findPaginated('tenant-1', query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('entity.name', 'ASC');
    });
  });

  describe('inherited findAll', () => {
    it('always filters by tenant_id', async () => {
      await repo.findAll('tenant-xyz');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-xyz' },
      );
    });
  });

  describe('inherited findById', () => {
    it('filters by tenant_id and id', async () => {
      await repo.findById('id-1', 'tenant-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'id-1' },
      );
    });
  });
});

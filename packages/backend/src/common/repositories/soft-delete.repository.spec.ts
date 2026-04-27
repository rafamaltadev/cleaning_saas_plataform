import { Repository } from 'typeorm';
import { FindOptions, SoftDeleteRepository } from './soft-delete.repository';

class TestEntity {
  id: string = '';
  tenant_id: string = '';
  deleted_at: Date | null = null;
  name: string = '';
}

class ConcreteRepository extends SoftDeleteRepository<TestEntity> {
  constructor(repo: Repository<TestEntity>) {
    super(repo);
  }
}

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('SoftDeleteRepository', () => {
  let repo: ConcreteRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<Pick<Repository<TestEntity>, 'createQueryBuilder' | 'save'>>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new ConcreteRepository(mockRepository as unknown as Repository<TestEntity>);
  });

  describe('findAll', () => {
    it('excludes records where deleted_at IS NOT NULL by default', async () => {
      await repo.findAll('tenant-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.deleted_at IS NULL',
      );
    });

    it('includes soft-deleted records when withDeleted: true is passed', async () => {
      await repo.findAll('tenant-1', undefined, { withDeleted: true });

      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        'entity.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-1' },
      );
    });

    it('always filters by tenant_id', async () => {
      await repo.findAll('tenant-abc');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-abc' },
      );
    });

    it('calls getMany and returns result', async () => {
      const entities = [{ id: '1', tenant_id: 'tenant-1', deleted_at: null, name: 'test' }];
      mockQueryBuilder.getMany.mockResolvedValue(entities);

      const result = await repo.findAll('tenant-1');
      expect(result).toEqual(entities);
    });
  });

  describe('findById', () => {
    it('excludes soft-deleted records by default', async () => {
      await repo.findById('id-1', 'tenant-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.deleted_at IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'id-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'tenant-1' },
      );
    });

    it('includes soft-deleted records when withDeleted: true', async () => {
      await repo.findById('id-1', 'tenant-1', { withDeleted: true });

      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        'entity.deleted_at IS NULL',
      );
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const entity = { id: '1', tenant_id: 't1', deleted_at: null, name: 'x' };
      mockRepository.save.mockResolvedValue(entity as TestEntity);

      const result = await repo.save(entity);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('softDelete', () => {
    it('sets deleted_at via QueryBuilder update', async () => {
      await repo.softDelete('id-1');

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date) }),
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', { id: 'id-1' });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('buildBaseQuery', () => {
    it('does not add deleted_at filter when withDeleted is explicitly false', async () => {
      await repo.findAll('tenant-1', undefined, { withDeleted: false } as FindOptions);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity.deleted_at IS NULL');
    });
  });
});

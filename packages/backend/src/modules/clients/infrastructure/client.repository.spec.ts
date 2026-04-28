import { Repository } from 'typeorm';
import { ClientRepository } from './client.repository';
import { Client } from '../domain/client.entity';

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

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+55119',
    address_id: null,
    preferred_language: 'pt-BR',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('ClientRepository', () => {
  let repo: ClientRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<Pick<Repository<Client>, 'createQueryBuilder' | 'save'>>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new ClientRepository(mockRepository as unknown as Repository<Client>);
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
  });

  describe('findByIdUnscoped', () => {
    it('finds client by id without tenant scoping', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(makeClient());

      const result = await repo.findByIdUnscoped('client-uuid');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'client-uuid' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('entity.deleted_at IS NULL');
      expect(result).not.toBeNull();
    });

    it('returns null when client not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      const result = await repo.findByIdUnscoped('missing-uuid');
      expect(result).toBeNull();
    });

    it('does not apply tenant_id filter', async () => {
      await repo.findByIdUnscoped('client-uuid');
      const andWhereCalls = mockQueryBuilder.andWhere.mock.calls;
      const tenantFiltered = andWhereCalls.some(([q]: [string]) =>
        q.includes('tenant_id'),
      );
      expect(tenantFiltered).toBe(false);
    });
  });
});

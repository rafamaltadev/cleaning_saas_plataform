import { Repository } from 'typeorm';
import { AddressRepository } from './address.repository';
import { Address } from '../domain/address.entity';

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

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'addr-uuid',
    tenant_id: 'tenant-uuid',
    street: '123 Main St',
    city: 'SP',
    state: 'SP',
    postal_code: '01310-100',
    country: 'Brazil',
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('AddressRepository', () => {
  let repo: AddressRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockRepository: jest.Mocked<Pick<Repository<Address>, 'createQueryBuilder' | 'save'>>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    repo = new AddressRepository(mockRepository as unknown as Repository<Address>);
  });

  describe('findById (inherited)', () => {
    it('excludes soft-deleted records by default', async () => {
      await repo.findById('addr-uuid', 'tenant-uuid');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entity.deleted_at IS NULL');
    });

    it('filters by tenant_id and id', async () => {
      await repo.findById('addr-uuid', 'my-tenant');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.tenant_id = :tenantId',
        { tenantId: 'my-tenant' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entity.id = :id',
        { id: 'addr-uuid' },
      );
    });

    it('returns null when address not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      const result = await repo.findById('missing', 'tenant-uuid');
      expect(result).toBeNull();
    });

    it('returns address when found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(makeAddress());
      const result = await repo.findById('addr-uuid', 'tenant-uuid');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('addr-uuid');
    });
  });

  describe('save (inherited)', () => {
    it('saves and returns the address', async () => {
      const address = makeAddress();
      mockRepository.save.mockResolvedValue(address);

      const result = await repo.save(address);
      expect(result.id).toBe('addr-uuid');
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServiceRepository } from '../infrastructure/service.repository';
import { Service } from '../domain/service.entity';
import { ServiceResponseDto } from '../domain/service-response.dto';

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Service',
    description: 'Test description',
    base_rate_cents: 1000,
    unit: 'flat',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('ServicesService', () => {
  let service: ServicesService;
  let repoMock: jest.Mocked<
    Pick<ServiceRepository, 'findPaginated' | 'findById' | 'save'>
  >;

  beforeEach(() => {
    repoMock = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    service = new ServicesService(repoMock as unknown as ServiceRepository);
  });

  describe('findAll', () => {
    it('returns paginated ServiceResponseDtos', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeService()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(ServiceResponseDto);
      expect(result.meta.total).toBe(1);
    });

    it('calls findPaginated with the correct tenantId', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.findAll('my-tenant', { page: 1, limit: 20, order: 'ASC' });

      expect(repoMock.findPaginated).toHaveBeenCalledWith('my-tenant', expect.any(Object));
    });

    it('does not expose deleted_at on returned items', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeService({ deleted_at: new Date() })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items[0]).not.toHaveProperty('deleted_at');
    });

    // Integration scenario: does not return services belonging to a different tenant
    it('only returns services for the requested tenantId (tenant isolation)', async () => {
      const ownService = makeService({ id: 'own-uuid', tenant_id: 'tenant-a' });
      repoMock.findPaginated.mockImplementation(async (tenantId) => {
        const items = tenantId === 'tenant-a' ? [ownService] : [];
        return { items, meta: { total: items.length, page: 1, limit: 20, totalPages: items.length } };
      });

      const resultA = await service.findAll('tenant-a', { page: 1, limit: 20, order: 'ASC' });
      const resultB = await service.findAll('tenant-b', { page: 1, limit: 20, order: 'ASC' });

      expect(resultA.items).toHaveLength(1);
      expect(resultB.items).toHaveLength(0);
    });

    // Integration scenario: does not return soft-deleted services
    it('does not return soft-deleted services', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(repoMock.findPaginated).toHaveBeenCalled();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Service',
      description: 'A service',
      base_rate_cents: 500,
      unit: 'flat' as const,
    };

    it('saves service with the correct tenant_id', async () => {
      repoMock.save.mockResolvedValue(makeService());

      await service.create('my-tenant', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'my-tenant' }),
      );
    });

    it('returns ServiceResponseDto without deleted_at', async () => {
      repoMock.save.mockResolvedValue(makeService());

      const result = await service.create('tenant-uuid', createDto);

      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('passes all dto fields to repository save', async () => {
      repoMock.save.mockResolvedValue(makeService());

      await service.create('tenant-uuid', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Service',
          description: 'A service',
          base_rate_cents: 500,
          unit: 'flat',
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when service does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('tenant-uuid', 'missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns ServiceResponseDto without deleted_at', async () => {
      repoMock.findById.mockResolvedValue(makeService());
      repoMock.save.mockResolvedValue(makeService({ name: 'Updated' }));

      const result = await service.update('tenant-uuid', 'service-uuid', { name: 'Updated' });

      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('calls findById with serviceId and tenantId for tenant isolation', async () => {
      repoMock.findById.mockResolvedValue(makeService());
      repoMock.save.mockResolvedValue(makeService());

      await service.update('tenant-uuid', 'service-uuid', {});

      expect(repoMock.findById).toHaveBeenCalledWith('service-uuid', 'tenant-uuid');
    });
  });
});

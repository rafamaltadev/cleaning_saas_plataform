import { NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { StorageAdapter } from '../../../common/storage/storage.adapter';
import { Tenant } from '../domain/tenant.entity';
import { TenantResponseDto } from '../domain/tenant-response.dto';

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  const t = new Tenant();
  t.id = 'tenant-uuid';
  t.name = 'Test Tenant';
  t.subscription_plan = 'basic';
  t.currency = 'BRL';
  t.timezone = 'America/Sao_Paulo';
  t.tenant_slug = 'test-tenant';
  t.logo_url = null;
  t.primary_color = null;
  t.favicon_url = null;
  t.created_at = new Date('2024-01-01');
  t.updated_at = new Date('2024-06-01');
  t.deleted_at = null;
  return Object.assign(t, overrides);
}

describe('TenantService', () => {
  let service: TenantService;
  let repoMock: jest.Mocked<Pick<TenantRepository, 'findById' | 'findBySlug' | 'save'>>;
  let storageMock: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    repoMock = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
    };
    storageMock = { save: jest.fn(), delete: jest.fn() };
    service = new TenantService(
      repoMock as unknown as TenantRepository,
      storageMock as unknown as StorageAdapter,
    );
  });

  describe('getById', () => {
    it('returns a TenantResponseDto when tenant exists', async () => {
      repoMock.findById.mockResolvedValue(makeTenant());

      const result = await service.getById('tenant-uuid');

      expect(result).toBeInstanceOf(TenantResponseDto);
      expect(result.id).toBe('tenant-uuid');
      expect(result.name).toBe('Test Tenant');
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.getById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not expose deleted_at in the returned DTO', async () => {
      repoMock.findById.mockResolvedValue(makeTenant());

      const result = await service.getById('tenant-uuid');

      expect(result).not.toHaveProperty('deleted_at');
    });
  });

  describe('update', () => {
    it('merges dto fields and returns updated DTO', async () => {
      const tenant = makeTenant();
      repoMock.findById.mockResolvedValue(tenant);
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.update('tenant-uuid', {
        timezone: 'UTC',
        name: 'New Name',
      });

      expect(result.timezone).toBe('UTC');
      expect(result.name).toBe('New Name');
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls save with the modified tenant', async () => {
      const tenant = makeTenant();
      repoMock.findById.mockResolvedValue(tenant);
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      await service.update('tenant-uuid', { currency: 'USD' });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' }),
      );
    });
  });
});

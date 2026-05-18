import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { StorageAdapter } from '../../../common/storage/storage.adapter';
import { Tenant } from '../domain/tenant.entity';

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

function makeFile(overrides: Partial<{ originalname: string; mimetype: string; size: number; buffer: Buffer }> = {}) {
  return {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
    ...overrides,
  };
}

describe('TenantService — branding & uploads', () => {
  let service: TenantService;
  let repoMock: jest.Mocked<Pick<TenantRepository, 'findById' | 'findBySlug' | 'save'>>;
  let storageMock: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    repoMock = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
    };
    storageMock = {
      save: jest.fn(),
      delete: jest.fn(),
    };
    service = new TenantService(
      repoMock as unknown as TenantRepository,
      storageMock as unknown as StorageAdapter,
    );
  });

  describe('update — branding fields', () => {
    it('accepts valid logo_url, primary_color and favicon_url', async () => {
      const tenant = makeTenant();
      repoMock.findById.mockResolvedValue(tenant);
      repoMock.findBySlug.mockResolvedValue(null);
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.update('tenant-uuid', {
        logo_url: '/uploads/logo.png',
        primary_color: '#FF5500',
        favicon_url: '/uploads/favicon.png',
      });

      expect(result.logo_url).toBe('/uploads/logo.png');
      expect(result.primary_color).toBe('#FF5500');
      expect(result.favicon_url).toBe('/uploads/favicon.png');
    });

    it('rejects duplicate tenant_slug with ConflictException', async () => {
      repoMock.findById.mockResolvedValue(makeTenant());
      const otherTenant = makeTenant({ id: 'other-uuid', tenant_slug: 'taken-slug' });
      repoMock.findBySlug.mockResolvedValue(otherTenant);

      await expect(
        service.update('tenant-uuid', { tenant_slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows keeping the same tenant_slug', async () => {
      const tenant = makeTenant({ tenant_slug: 'my-slug' });
      repoMock.findById.mockResolvedValue(tenant);
      repoMock.findBySlug.mockResolvedValue(tenant);
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.update('tenant-uuid', { tenant_slug: 'my-slug' });

      expect(result.tenant_slug).toBe('my-slug');
    });
  });

  describe('uploadLogo', () => {
    it('accepts image/png file up to 2MB', async () => {
      const tenant = makeTenant();
      repoMock.findById.mockResolvedValue(tenant);
      storageMock.save.mockResolvedValue('/uploads/logo.png');
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.uploadLogo('tenant-uuid', makeFile());

      expect(result.logo_url).toBe('/uploads/logo.png');
      expect(storageMock.save).toHaveBeenCalled();
    });

    it('rejects file larger than 2MB', async () => {
      repoMock.findById.mockResolvedValue(makeTenant());

      await expect(
        service.uploadLogo('tenant-uuid', makeFile({ size: 3 * 1024 * 1024 })),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects non-image MIME types', async () => {
      repoMock.findById.mockResolvedValue(makeTenant());

      await expect(
        service.uploadLogo('tenant-uuid', makeFile({ mimetype: 'application/pdf' })),
      ).rejects.toThrow(ConflictException);
    });

    it('accepts image/jpeg MIME type', async () => {
      const tenant = makeTenant();
      repoMock.findById.mockResolvedValue(tenant);
      storageMock.save.mockResolvedValue('/uploads/logo.jpg');
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.uploadLogo(
        'tenant-uuid',
        makeFile({ mimetype: 'image/jpeg', originalname: 'logo.jpg' }),
      );

      expect(result.logo_url).toBe('/uploads/logo.jpg');
    });
  });

  describe('update — validation', () => {
    it('does not override unchanged fields', async () => {
      const tenant = makeTenant({ name: 'Original Name', primary_color: '#000000' });
      repoMock.findById.mockResolvedValue(tenant);
      repoMock.findBySlug.mockResolvedValue(null);
      repoMock.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.update('tenant-uuid', { logo_url: '/new.png' });

      expect(result.name).toBe('Original Name');
      expect(result.primary_color).toBe('#000000');
    });
  });
});

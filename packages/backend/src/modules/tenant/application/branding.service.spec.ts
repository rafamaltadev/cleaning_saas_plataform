import { BrandingService } from './branding.service';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { Tenant } from '../domain/tenant.entity';

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  const t = new Tenant();
  t.id = 'tenant-uuid';
  t.name = 'Test Tenant';
  t.email = 'test@tenant.local';
  t.subscription_plan = 'basic';
  t.stripe_customer_id = null;
  t.currency = 'BRL';
  t.timezone = 'America/Sao_Paulo';
  t.tenant_slug = 'test-tenant';
  t.logo_url = null;
  t.primary_color = '#4F46E5';
  t.favicon_url = null;
  t.created_at = new Date('2024-01-01');
  t.updated_at = new Date('2024-06-01');
  t.deleted_at = null;
  return Object.assign(t, overrides);
}

describe('BrandingService', () => {
  let service: BrandingService;
  let repoMock: jest.Mocked<Pick<TenantRepository, 'findBySlug'>>;

  beforeEach(() => {
    repoMock = { findBySlug: jest.fn() };
    service = new BrandingService(repoMock as unknown as TenantRepository);
  });

  describe('getBrandingBySlug', () => {
    it('returns branding data for an existing tenant slug', async () => {
      repoMock.findBySlug.mockResolvedValue(makeTenant());

      const result = await service.getBrandingBySlug('test-tenant');

      expect(result).not.toBeNull();
      expect(result!.tenant_slug).toBe('test-tenant');
      expect(result!.name).toBe('Test Tenant');
      expect(result!.primary_color).toBe('#4F46E5');
    });

    it('returns null for unknown tenant slug', async () => {
      repoMock.findBySlug.mockResolvedValue(null);

      const result = await service.getBrandingBySlug('unknown-slug');

      expect(result).toBeNull();
    });

    it('does NOT expose tenant_id, created_by, or any internal fields', async () => {
      repoMock.findBySlug.mockResolvedValue(makeTenant());

      const result = await service.getBrandingBySlug('test-tenant');

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('tenant_id');
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('subscription_plan');
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('returns cached result on second call within 60 seconds', async () => {
      repoMock.findBySlug.mockResolvedValue(makeTenant());

      await service.getBrandingBySlug('test-tenant');
      await service.getBrandingBySlug('test-tenant');

      expect(repoMock.findBySlug).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after cache TTL expires', async () => {
      repoMock.findBySlug.mockResolvedValue(makeTenant());

      jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(61_000);

      await service.getBrandingBySlug('test-tenant');
      await service.getBrandingBySlug('test-tenant');

      expect(repoMock.findBySlug).toHaveBeenCalledTimes(2);
    });
  });
});

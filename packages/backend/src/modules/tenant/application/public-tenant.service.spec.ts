import { PublicTenantService } from './public-tenant.service';
import { Tenant } from '../domain/tenant.entity';
import { Service } from '../../services/domain/service.entity';
import { ServiceCategory } from '../../services/domain/service-category.entity';
import { IsNull } from 'typeorm';

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Acme Clean',
    email: 'acme@tenant.local',
    subscription_plan: 'basic',
    stripe_customer_id: null,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    tenant_slug: 'acme-clean',
    logo_url: null,
    primary_color: '#4F46E5',
    favicon_url: null,
    description: 'Professional cleaning',
    phone: '+55 11 99999-9999',
    social_links: { instagram: 'https://instagram.com/acme' },
    google_maps_embed_url: null,
    public_address: 'Rua Exemplo, 123',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Tenant;
}

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    tenant_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Limpeza Residencial',
    description: 'Limpeza completa',
    base_rate_cents: 15000,
    unit: 'flat',
    category_id: null,
    estimated_duration_minutes: null,
    billing_type: 'fixed',
    availability: null,
    materials_included: false,
    materials_cost_cents: null,
    observations: null,
    has_addons: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Service;
}

describe('PublicTenantService', () => {
  let service: PublicTenantService;
  let tenantRepository: { findBySlug: jest.Mock };
  let serviceRepo: { find: jest.Mock; findByIds: jest.Mock };
  let categoryRepo: { find: jest.Mock; findByIds: jest.Mock };

  beforeEach(() => {
    tenantRepository = { findBySlug: jest.fn() };
    serviceRepo = { find: jest.fn(), findByIds: jest.fn() };
    categoryRepo = { find: jest.fn(), findByIds: jest.fn() };

    service = new PublicTenantService(
      tenantRepository as any,
      serviceRepo as any,
      categoryRepo as any,
    );
  });

  describe('getProfileBySlug', () => {
    it('returns public profile for existing tenant', async () => {
      const tenant = makeTenant();
      tenantRepository.findBySlug.mockResolvedValue(tenant);

      const result = await service.getProfileBySlug('acme-clean');

      expect(result).toEqual({
        tenant_slug: 'acme-clean',
        name: 'Acme Clean',
        description: 'Professional cleaning',
        phone: '+55 11 99999-9999',
        social_links: { instagram: 'https://instagram.com/acme' },
        google_maps_embed_url: null,
        public_address: 'Rua Exemplo, 123',
      });
    });

    it('returns null for unknown tenant slug', async () => {
      tenantRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getProfileBySlug('unknown-slug');

      expect(result).toBeNull();
    });

    it('returns null for soft-deleted tenant (findBySlug filters deleted_at IS NULL)', async () => {
      tenantRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getProfileBySlug('deleted-slug');

      expect(result).toBeNull();
    });

    it('does NOT include tenant id or internal fields in result', async () => {
      const tenant = makeTenant();
      tenantRepository.findBySlug.mockResolvedValue(tenant);

      const result = await service.getProfileBySlug('acme-clean');

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
      expect(result).not.toHaveProperty('deleted_at');
      expect(result).not.toHaveProperty('subscription_plan');
      expect(result).not.toHaveProperty('logo_url');
    });
  });

  describe('getServicesBySlug', () => {
    it('returns services for existing tenant without soft-deleted ones', async () => {
      const tenant = makeTenant();
      const activeService = makeService();
      tenantRepository.findBySlug.mockResolvedValue(tenant);
      serviceRepo.find.mockResolvedValue([activeService]);
      categoryRepo.findByIds.mockResolvedValue([]);

      const result = await service.getServicesBySlug('acme-clean');

      expect(serviceRepo.find).toHaveBeenCalledWith({
        where: { tenant_id: tenant.id, deleted_at: IsNull() },
      });
      expect(result).toHaveLength(1);
      expect(result![0]).toMatchObject({
        id: activeService.id,
        name: activeService.name,
        description: activeService.description,
        base_rate_cents: activeService.base_rate_cents,
        unit: activeService.unit,
        currency: 'BRL',
        category_name: null,
      });
    });

    it('returns null for unknown tenant slug', async () => {
      tenantRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getServicesBySlug('unknown-slug');

      expect(result).toBeNull();
    });

    it('includes category_name when service has a category', async () => {
      const tenant = makeTenant();
      const category = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Residencial' } as ServiceCategory;
      const svc = makeService({ category_id: category.id });
      tenantRepository.findBySlug.mockResolvedValue(tenant);
      serviceRepo.find.mockResolvedValue([svc]);
      categoryRepo.findByIds.mockResolvedValue([category]);

      const result = await service.getServicesBySlug('acme-clean');

      expect(result![0].category_name).toBe('Residencial');
    });

    it('does NOT expose tenant_id or created_by in service items', async () => {
      const tenant = makeTenant();
      const svc = makeService();
      tenantRepository.findBySlug.mockResolvedValue(tenant);
      serviceRepo.find.mockResolvedValue([svc]);
      categoryRepo.findByIds.mockResolvedValue([]);

      const result = await service.getServicesBySlug('acme-clean');

      expect(result![0]).not.toHaveProperty('tenant_id');
      expect(result![0]).not.toHaveProperty('created_by');
      expect(result![0]).not.toHaveProperty('deleted_at');
    });

    it('returns services only for the requested tenant (cross-tenant isolation)', async () => {
      const tenantA = makeTenant({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tenant_slug: 'tenant-a',
      });
      const tenantAService = makeService({
        id: 'aaaa1111-0000-0000-0000-000000000001',
        tenant_id: tenantA.id,
        name: 'Service A',
      });

      tenantRepository.findBySlug.mockImplementation((slug: string) => {
        if (slug === 'tenant-a') return Promise.resolve(tenantA);
        return Promise.resolve(null);
      });
      serviceRepo.find.mockResolvedValue([tenantAService]);
      categoryRepo.findByIds.mockResolvedValue([]);

      const resultA = await service.getServicesBySlug('tenant-a');
      const resultB = await service.getServicesBySlug('tenant-b');

      expect(resultA).toHaveLength(1);
      expect(resultA![0].name).toBe('Service A');
      expect(resultB).toBeNull();
    });
  });
});

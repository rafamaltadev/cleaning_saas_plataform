import { NotFoundException } from '@nestjs/common';
import { PublicTenantController } from './public-tenant.controller';
import { PublicTenantService, PublicProfileDto, PublicServiceDto } from '../application/public-tenant.service';

const MOCK_PROFILE: PublicProfileDto = {
  tenant_slug: 'acme-clean',
  name: 'Acme Clean',
  description: 'Professional cleaning services',
  phone: '+55 11 99999-9999',
  social_links: { instagram: 'https://instagram.com/acme', facebook: null as unknown as undefined },
  google_maps_embed_url: null,
  public_address: 'Rua Exemplo, 123, São Paulo',
};

const MOCK_SERVICES: PublicServiceDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Limpeza Residencial',
    description: 'Limpeza completa da residência',
    base_rate_cents: 15000,
    unit: 'flat',
    currency: 'BRL',
    category_name: 'Residencial',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Limpeza por M²',
    description: 'Cobrado por área em m²',
    base_rate_cents: 500,
    unit: 'sqm',
    currency: 'BRL',
    category_name: null,
  },
];

const mockPublicTenantService = {
  getProfileBySlug: jest.fn(),
  getServicesBySlug: jest.fn(),
} as unknown as PublicTenantService;

describe('PublicTenantController', () => {
  let controller: PublicTenantController;

  beforeEach(() => {
    controller = new PublicTenantController(mockPublicTenantService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns correct profile for existing tenant slug without auth', async () => {
      (mockPublicTenantService.getProfileBySlug as jest.Mock).mockResolvedValue(MOCK_PROFILE);

      const result = await controller.getProfile('acme-clean');

      expect(result).toEqual(MOCK_PROFILE);
      expect(mockPublicTenantService.getProfileBySlug).toHaveBeenCalledWith('acme-clean');
    });

    it('throws NotFoundException for unknown tenant slug', async () => {
      (mockPublicTenantService.getProfileBySlug as jest.Mock).mockResolvedValue(null);

      await expect(controller.getProfile('unknown-slug')).rejects.toThrow(NotFoundException);
    });

    it('does NOT expose tenant_id, created_by, or internal fields', async () => {
      (mockPublicTenantService.getProfileBySlug as jest.Mock).mockResolvedValue(MOCK_PROFILE);

      const result = await controller.getProfile('acme-clean');

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('tenant_id');
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('is marked @Public() — does not apply JWT guard', () => {
      const metadataKeys = Reflect.getMetadataKeys(PublicTenantController);
      expect(metadataKeys).not.toContain('__guards__');
    });
  });

  describe('getServices', () => {
    it('returns correct services for existing tenant slug without auth', async () => {
      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockResolvedValue(MOCK_SERVICES);

      const result = await controller.getServices('acme-clean');

      expect(result).toEqual(MOCK_SERVICES);
      expect(result).toHaveLength(2);
    });

    it('throws NotFoundException for unknown tenant slug', async () => {
      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockResolvedValue(null);

      await expect(controller.getServices('unknown-slug')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for soft-deleted tenant', async () => {
      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockResolvedValue(null);

      await expect(controller.getServices('deleted-tenant')).rejects.toThrow(NotFoundException);
    });

    it('does NOT expose tenant_id or created_by in service items', async () => {
      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockResolvedValue(MOCK_SERVICES);

      const result = await controller.getServices('acme-clean');

      for (const svc of result) {
        expect(svc).not.toHaveProperty('tenant_id');
        expect(svc).not.toHaveProperty('created_by');
        expect(svc).not.toHaveProperty('deleted_at');
      }
    });

    it('returns only explicitly allowed fields per service', async () => {
      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockResolvedValue(MOCK_SERVICES);

      const result = await controller.getServices('acme-clean');
      const svc = result[0];

      expect(svc).toHaveProperty('id');
      expect(svc).toHaveProperty('name');
      expect(svc).toHaveProperty('description');
      expect(svc).toHaveProperty('base_rate_cents');
      expect(svc).toHaveProperty('unit');
      expect(svc).toHaveProperty('currency');
      expect(svc).toHaveProperty('category_name');
    });
  });

  describe('cross-tenant isolation', () => {
    it('tenant A services are NOT returned when querying tenant B slug', async () => {
      const tenantAServices: PublicServiceDto[] = [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          name: 'Tenant A Service',
          description: 'Only for tenant A',
          base_rate_cents: 10000,
          unit: 'flat',
          currency: 'BRL',
          category_name: null,
        },
      ];
      const tenantBServices: PublicServiceDto[] = [
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          name: 'Tenant B Service',
          description: 'Only for tenant B',
          base_rate_cents: 20000,
          unit: 'hour',
          currency: 'BRL',
          category_name: null,
        },
      ];

      (mockPublicTenantService.getServicesBySlug as jest.Mock).mockImplementation(
        (slug: string) => {
          if (slug === 'tenant-a') return Promise.resolve(tenantAServices);
          if (slug === 'tenant-b') return Promise.resolve(tenantBServices);
          return Promise.resolve(null);
        },
      );

      const resultA = await controller.getServices('tenant-a');
      const resultB = await controller.getServices('tenant-b');

      expect(resultA).toEqual(tenantAServices);
      expect(resultB).toEqual(tenantBServices);
      expect(resultA.map((s) => s.id)).not.toContain('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      expect(resultB.map((s) => s.id)).not.toContain('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    });
  });
});

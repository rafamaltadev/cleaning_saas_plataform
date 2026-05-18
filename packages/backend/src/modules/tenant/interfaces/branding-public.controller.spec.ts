import { NotFoundException } from '@nestjs/common';
import { BrandingPublicController } from './branding-public.controller';
import { BrandingService, BrandingDto } from '../application/branding.service';

const MOCK_BRANDING: BrandingDto = {
  tenant_slug: 'acme-clean',
  name: 'Acme Clean',
  logo_url: '/uploads/acme-logo.png',
  primary_color: '#4F46E5',
  favicon_url: null,
};

const mockBrandingService = {
  getBrandingBySlug: jest.fn(),
} as unknown as BrandingService;

describe('BrandingPublicController', () => {
  let controller: BrandingPublicController;

  beforeEach(() => {
    controller = new BrandingPublicController(mockBrandingService);
    jest.clearAllMocks();
  });

  describe('getBranding', () => {
    it('returns correct branding for existing tenant slug', async () => {
      (mockBrandingService.getBrandingBySlug as jest.Mock).mockResolvedValue(MOCK_BRANDING);

      const result = await controller.getBranding('acme-clean');

      expect(result).toEqual(MOCK_BRANDING);
      expect(mockBrandingService.getBrandingBySlug).toHaveBeenCalledWith('acme-clean');
    });

    it('throws NotFoundException for unknown tenant slug', async () => {
      (mockBrandingService.getBrandingBySlug as jest.Mock).mockResolvedValue(null);

      await expect(controller.getBranding('unknown-slug')).rejects.toThrow(NotFoundException);
    });

    it('works without authentication (no guard applied)', () => {
      const metadataKeys = Reflect.getMetadataKeys(BrandingPublicController);
      expect(metadataKeys).not.toContain('__guards__');
    });

    it('does NOT expose tenant_id, created_by, or any internal fields in the response', async () => {
      (mockBrandingService.getBrandingBySlug as jest.Mock).mockResolvedValue(MOCK_BRANDING);

      const result = await controller.getBranding('acme-clean');

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('tenant_id');
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('deleted_at');
    });
  });
});

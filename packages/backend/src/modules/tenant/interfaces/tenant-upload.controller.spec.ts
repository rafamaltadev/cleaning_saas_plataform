import { BadRequestException } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from '../application/tenant.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

function makeFile(overrides: Partial<{ originalname: string; mimetype: string; size: number; buffer: Buffer }> = {}) {
  return {
    originalname: 'logo.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake'),
    ...overrides,
  };
}

function makeRequest(tenantId: string): Request & { user?: AuthUser } {
  return { user: { userId: 'actor-uuid', tenantId, roles: ['tenant_admin'] } } as any;
}

const mockTenantService = {
  getById: jest.fn(),
  update: jest.fn(),
  uploadLogo: jest.fn(),
  uploadFavicon: jest.fn(),
} as unknown as TenantService;

describe('TenantController — file uploads', () => {
  let controller: TenantController;

  beforeEach(() => {
    controller = new TenantController(mockTenantService);
    jest.clearAllMocks();
  });

  describe('uploadLogo', () => {
    it('delegates to tenantService.uploadLogo with tenantId and file', async () => {
      const file = makeFile();
      (mockTenantService.uploadLogo as jest.Mock).mockResolvedValue({ logo_url: '/uploads/logo.png' });

      const result = await controller.uploadLogo(makeRequest('tenant-uuid'), file as any);

      expect(mockTenantService.uploadLogo).toHaveBeenCalledWith('tenant-uuid', file);
      expect(result).toEqual({ logo_url: '/uploads/logo.png' });
    });

    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        controller.uploadLogo(makeRequest('tenant-uuid'), undefined as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadFavicon', () => {
    it('delegates to tenantService.uploadFavicon with tenantId and file', async () => {
      const file = makeFile({ originalname: 'favicon.png' });
      (mockTenantService.uploadFavicon as jest.Mock).mockResolvedValue({ favicon_url: '/uploads/favicon.png' });

      const result = await controller.uploadFavicon(makeRequest('tenant-uuid'), file as any);

      expect(mockTenantService.uploadFavicon).toHaveBeenCalledWith('tenant-uuid', file);
      expect(result).toEqual({ favicon_url: '/uploads/favicon.png' });
    });

    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        controller.uploadFavicon(makeRequest('tenant-uuid'), undefined as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

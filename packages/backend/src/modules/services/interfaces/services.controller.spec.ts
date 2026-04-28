import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServicesController } from './services.controller';
import { ServicesService } from '../application/services.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockServicesService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as ServicesService;

function makeRequest(
  tenantId: string,
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId: 'actor-uuid', tenantId, roles } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(() => {
    controller = new ServicesController(mockServicesService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('delegates to servicesService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockServicesService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.getAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockServicesService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to servicesService.create with tenantId and dto', async () => {
      const dto = { name: 'S', description: 'D', base_rate_cents: 100, unit: 'flat' as const };
      const created = { id: 'new-uuid', name: 'S' };
      (mockServicesService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid'), dto as any);

      expect(mockServicesService.create).toHaveBeenCalledWith('tenant-uuid', dto);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to servicesService.update with tenantId, id, and dto', async () => {
      const dto = { name: 'Updated' };
      const updated = { id: 'service-uuid', name: 'Updated' };
      (mockServicesService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(makeRequest('tenant-uuid'), 'service-uuid', dto as any);

      expect(mockServicesService.update).toHaveBeenCalledWith('tenant-uuid', 'service-uuid', dto);
      expect(result).toBe(updated);
    });
  });

  // Integration scenario: staff role is rejected by RolesGuard
  describe('RolesGuard integration: staff role returns 403', () => {
    it('throws ForbiddenException when user has only staff role', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u', tenantId: 't', roles: ['staff'] },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows access when user has supervisor role', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u', tenantId: 't', roles: ['supervisor'] },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});

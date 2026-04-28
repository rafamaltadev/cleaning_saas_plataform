import { AvailabilityController } from './availability.controller';
import { SchedulingService } from '../application/scheduling.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockSchedulingService = {
  findAll: jest.fn(),
  createAvailability: jest.fn(),
} as unknown as SchedulingService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  beforeEach(() => {
    controller = new AvailabilityController(mockSchedulingService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to schedulingService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockSchedulingService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockSchedulingService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to schedulingService.createAvailability with tenantId, actorId, and dto', async () => {
      const dto = {
        employee_id: 'emp-uuid',
        available_date: '2026-05-01',
        start_time: '09:00',
        end_time: '12:00',
      };
      const created = { id: 'avail-uuid' };
      (mockSchedulingService.createAvailability as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid', 'actor-uuid'), dto as any);

      expect(mockSchedulingService.createAvailability).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(created);
    });
  });

  describe('RolesGuard: staff role is allowed on POST /availability', () => {
    it('allows staff role on POST (handler-level @Roles override)', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['staff', 'supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'u', tenantId: 't', roles: ['staff'] } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects staff role on GET (class-level @Roles: supervisor+)', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'u', tenantId: 't', roles: ['staff'] } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow();
    });
  });
});

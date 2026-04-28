import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BookingsController } from './bookings.controller';
import { BookingService } from '../application/booking.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockBookingService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  complete: jest.fn(),
} as unknown as BookingService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('BookingsController', () => {
  let controller: BookingsController;

  beforeEach(() => {
    controller = new BookingsController(mockBookingService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to bookingService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockBookingService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockBookingService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('findById', () => {
    it('delegates to bookingService.findById with id and tenantId', async () => {
      const result = { id: 'booking-uuid' };
      (mockBookingService.findById as jest.Mock).mockResolvedValue(result);

      const response = await controller.findById(makeRequest('tenant-uuid'), 'booking-uuid');

      expect(mockBookingService.findById).toHaveBeenCalledWith('booking-uuid', 'tenant-uuid');
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to bookingService.create with tenantId, actorId, and dto', async () => {
      const dto = {
        quote_id: 'q',
        client_id: 'c',
        service_id: 's',
        scheduled_start: '2026-05-01T09:00:00Z',
        scheduled_end: '2026-05-01T11:00:00Z',
        idempotency_key: 'key-1',
      };
      const created = { id: 'new-uuid' };
      (mockBookingService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid', 'actor-uuid'), dto as any);

      expect(mockBookingService.create).toHaveBeenCalledWith('tenant-uuid', 'actor-uuid', dto);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to bookingService.update with id, tenantId, actorId, and dto', async () => {
      const dto = { status: 'rescheduled' as const };
      const updated = { id: 'booking-uuid', status: 'rescheduled' };
      (mockBookingService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'booking-uuid',
        dto as any,
      );

      expect(mockBookingService.update).toHaveBeenCalledWith(
        'booking-uuid',
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });

  describe('complete', () => {
    it('delegates to bookingService.complete with id, tenantId, and actorId', async () => {
      const completed = { id: 'booking-uuid', status: 'completed' };
      (mockBookingService.complete as jest.Mock).mockResolvedValue(completed);

      const result = await controller.complete(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'booking-uuid',
      );

      expect(mockBookingService.complete).toHaveBeenCalledWith(
        'booking-uuid',
        'tenant-uuid',
        'actor-uuid',
      );
      expect(result).toBe(completed);
    });
  });

  describe('RolesGuard: staff role is rejected on POST /bookings', () => {
    it('throws ForbiddenException when user has only staff role', () => {
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

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});

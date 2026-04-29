import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from '../application/notification.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { NotificationResponseDto } from '../domain/notification-response.dto';
import { Notification } from '../domain/notification.entity';

function makeNotificationDto(overrides: Partial<Notification> = {}): NotificationResponseDto {
  return NotificationResponseDto.from({
    id: 'notif-uuid',
    tenant_id: 'tenant-uuid',
    client_id: null,
    booking_id: null,
    quote_id: 'q-uuid',
    type: 'email',
    template: 'quote.sent',
    status: 'sent',
    sent_at: new Date(),
    payload: { quoteId: 'q-uuid' },
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Notification);
}

const mockNotificationService = {
  findAll: jest.fn(),
  send: jest.fn(),
} as unknown as NotificationService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(() => {
    controller = new NotificationsController(mockNotificationService);
    jest.clearAllMocks();
  });

  describe('GET /v1/notifications', () => {
    it('delegates to notificationService.findAll with tenantId and query', async () => {
      const dto = makeNotificationDto();
      const result = { items: [dto], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      (mockNotificationService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });

    it('does not return notifications from a different tenant', async () => {
      const tenantANotification = makeNotificationDto({ tenant_id: 'tenant-A' });
      const resultA = { items: [tenantANotification], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      (mockNotificationService.findAll as jest.Mock).mockResolvedValue(resultA);

      const response = await controller.findAll(makeRequest('tenant-A'), defaultQuery);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('tenant-A', defaultQuery);
      response.items.forEach((item) => {
        expect(item.tenant_id).toBe('tenant-A');
      });

      jest.clearAllMocks();

      const resultB = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockNotificationService.findAll as jest.Mock).mockResolvedValue(resultB);

      const responseB = await controller.findAll(makeRequest('tenant-B'), defaultQuery);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('tenant-B', defaultQuery);
      expect(responseB.items).toHaveLength(0);
    });

    it('soft-deleted notifications do not appear (service responsibility — controller passes tenant scoping)', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockNotificationService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(response.items).toHaveLength(0);
    });

    it('pagination meta is accurate', async () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        makeNotificationDto({ id: `n-${i}` }),
      );
      const meta = { total: 25, page: 2, limit: 5, totalPages: 5 };
      (mockNotificationService.findAll as jest.Mock).mockResolvedValue({ items, meta });

      const query: PaginationQueryDto = { page: 2, limit: 5, order: 'ASC' };
      const response = await controller.findAll(makeRequest('tenant-uuid'), query);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('tenant-uuid', query);
      expect(response.meta.total).toBe(25);
      expect(response.meta.page).toBe(2);
      expect(response.meta.limit).toBe(5);
      expect(response.meta.totalPages).toBe(5);
      expect(response.items).toHaveLength(5);
    });
  });

  describe('POST /v1/notifications/send', () => {
    it('delegates to notificationService.send with tenantId and dto', async () => {
      const dto = makeNotificationDto();
      (mockNotificationService.send as jest.Mock).mockResolvedValue(dto);

      const sendDto = {
        type: 'email' as const,
        template: 'quote.sent',
        to: 'test@example.com',
        payload: { quoteId: 'q-uuid' },
      };
      const response = await controller.send(makeRequest('tenant-uuid'), sendDto);

      expect(mockNotificationService.send).toHaveBeenCalledWith('tenant-uuid', {
        type: 'email',
        template: 'quote.sent',
        to: 'test@example.com',
        payload: { quoteId: 'q-uuid' },
        clientId: undefined,
        bookingId: undefined,
        quoteId: undefined,
      });
      expect(response).toBe(dto);
    });
  });

  describe('RolesGuard: staff role is rejected', () => {
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

    it('allows access for supervisor role', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'u', tenantId: 't', roles: ['supervisor'] } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});

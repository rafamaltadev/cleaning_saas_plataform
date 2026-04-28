import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QuotesController } from './quotes.controller';
import { QuoteService } from '../application/quote.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockQuoteService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  send: jest.fn(),
} as unknown as QuoteService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  permissions: string[] = [],
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles, permissions } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('QuotesController', () => {
  let controller: QuotesController;

  beforeEach(() => {
    controller = new QuotesController(mockQuoteService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to quoteService.findAll with tenantId, actorId, and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockQuoteService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid', 'user-uuid'), defaultQuery);

      expect(mockQuoteService.findAll).toHaveBeenCalledWith('tenant-uuid', 'user-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('findById', () => {
    it('delegates to quoteService.findById with id, tenantId, and actorId', async () => {
      const result = { id: 'quote-uuid' };
      (mockQuoteService.findById as jest.Mock).mockResolvedValue(result);

      const response = await controller.findById(makeRequest('tenant-uuid', 'user-uuid'), 'quote-uuid');

      expect(mockQuoteService.findById).toHaveBeenCalledWith('quote-uuid', 'tenant-uuid', 'user-uuid');
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to quoteService.create with tenantId, actorId, and dto', async () => {
      const dto = {
        client_id: 'client-uuid',
        service_id: 'service-uuid',
        currency: 'BRL',
        valid_until: '2026-12-31T00:00:00.000Z',
      };
      const created = { id: 'new-uuid', estimated_total_cents: 2500 };
      (mockQuoteService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid', 'actor-uuid'), dto as any);

      expect(mockQuoteService.create).toHaveBeenCalledWith('tenant-uuid', 'actor-uuid', dto);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to quoteService.update with id, tenantId, actorId, and dto', async () => {
      const dto = { manual_discount_percent: 10 };
      const updated = { id: 'quote-uuid', manual_discount_percent: 10 };
      (mockQuoteService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'quote-uuid',
        dto as any,
      );

      expect(mockQuoteService.update).toHaveBeenCalledWith(
        'quote-uuid',
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });

  describe('send', () => {
    it('delegates to quoteService.send with id, tenantId, actorId, and permissions', async () => {
      const sent = { id: 'quote-uuid', status: 'sent' };
      (mockQuoteService.send as jest.Mock).mockResolvedValue(sent);

      const result = await controller.send(
        makeRequest('tenant-uuid', 'actor-uuid', ['quotes.send']),
        'quote-uuid',
      );

      expect(mockQuoteService.send).toHaveBeenCalledWith(
        'quote-uuid',
        'tenant-uuid',
        'actor-uuid',
        ['quotes.send'],
      );
      expect(result).toBe(sent);
    });

    it('passes empty permissions array when user has no permissions', async () => {
      const sent = { id: 'quote-uuid', status: 'sent' };
      (mockQuoteService.send as jest.Mock).mockResolvedValue(sent);

      await controller.send(makeRequest('tenant-uuid', 'actor-uuid', undefined as any), 'quote-uuid');

      expect(mockQuoteService.send).toHaveBeenCalledWith(
        'quote-uuid',
        'tenant-uuid',
        'actor-uuid',
        [],
      );
    });

    it('returns 403 when service throws ForbiddenException (missing quotes.send)', async () => {
      (mockQuoteService.send as jest.Mock).mockRejectedValue(
        new ForbiddenException({ code: 'FORBIDDEN', message: 'Requires quotes.send permission' }),
      );

      await expect(
        controller.send(makeRequest('tenant-uuid', 'actor-uuid', []), 'quote-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

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

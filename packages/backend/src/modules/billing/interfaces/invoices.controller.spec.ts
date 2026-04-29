import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InvoicesController } from './invoices.controller';
import { BillingService } from '../application/billing.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { InvoiceResponseDto } from '../domain/invoice-response.dto';
import { Invoice } from '../domain/invoice.entity';

function makeInvoiceDto(overrides: Partial<Invoice> = {}): InvoiceResponseDto {
  return InvoiceResponseDto.from({
    id: 'inv-uuid',
    tenant_id: 'tenant-uuid',
    booking_id: 'booking-uuid',
    client_id: 'client-uuid',
    total_cents: 5000,
    currency: 'BRL',
    invoice_number: 'INV-0001',
    issued_at: new Date(),
    due_date: new Date(),
    status: 'issued',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Invoice);
}

const mockBillingService = {
  findAllInvoices: jest.fn(),
  createInvoice: jest.fn(),
} as unknown as BillingService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(() => {
    controller = new InvoicesController(mockBillingService);
    jest.clearAllMocks();
  });

  describe('GET /v1/invoices', () => {
    it('delegates to billingService.findAllInvoices with tenantId and query', async () => {
      const dto = makeInvoiceDto();
      const result = { items: [dto], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      (mockBillingService.findAllInvoices as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockBillingService.findAllInvoices).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });

    it('returns tenant-scoped results only', async () => {
      const dto = makeInvoiceDto({ tenant_id: 'tenant-A' });
      const result = { items: [dto], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      (mockBillingService.findAllInvoices as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-A'), defaultQuery);

      expect(mockBillingService.findAllInvoices).toHaveBeenCalledWith('tenant-A', defaultQuery);
      response.items.forEach((item) => {
        expect(item.tenant_id).toBe('tenant-A');
      });
    });

    it('returns empty list when no invoices exist', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockBillingService.findAllInvoices as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(response.items).toHaveLength(0);
      expect(response.meta.total).toBe(0);
    });
  });

  describe('POST /v1/invoices', () => {
    it('delegates to billingService.createInvoice with tenantId, userId, and dto', async () => {
      const dto = makeInvoiceDto();
      (mockBillingService.createInvoice as jest.Mock).mockResolvedValue(dto);

      const createDto = {
        booking_id: 'booking-uuid',
        client_id: 'client-uuid',
        total_cents: 5000,
        currency: 'BRL',
        due_date: '2026-12-31T00:00:00Z',
      };
      const response = await controller.create(makeRequest('tenant-uuid'), createDto);

      expect(mockBillingService.createInvoice).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        createDto,
      );
      expect(response).toBe(dto);
    });
  });

  describe('RolesGuard', () => {
    it('rejects staff role with ForbiddenException', () => {
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

    it('allows supervisor role', () => {
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

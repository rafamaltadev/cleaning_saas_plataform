import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentsController } from './payments.controller';
import { BillingService } from '../application/billing.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaymentResponseDto } from '../domain/payment-response.dto';
import { Payment } from '../domain/payment.entity';

function makePaymentDto(overrides: Partial<Payment> = {}): PaymentResponseDto {
  return PaymentResponseDto.from({
    id: 'pay-uuid',
    tenant_id: 'tenant-uuid',
    booking_id: 'booking-uuid',
    quote_id: null,
    amount_cents: 5000,
    currency: 'BRL',
    status: 'pending',
    payment_method: 'card',
    external_reference: null,
    idempotency_key: 'idem-key-123',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Payment);
}

const mockBillingService = {
  createPayment: jest.fn(),
} as unknown as BillingService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
  roles: string[] = ['supervisor'],
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles } } as any;
}

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(() => {
    controller = new PaymentsController(mockBillingService);
    jest.clearAllMocks();
  });

  describe('POST /v1/payments', () => {
    it('delegates to billingService.createPayment with tenantId, userId, and dto', async () => {
      const dto = makePaymentDto();
      (mockBillingService.createPayment as jest.Mock).mockResolvedValue(dto);

      const createDto = {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'idem-key-123',
      };
      const response = await controller.create(makeRequest('tenant-uuid'), createDto);

      expect(mockBillingService.createPayment).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        createDto,
      );
      expect(response).toBe(dto);
    });

    it('returns existing payment when idempotency_key already exists', async () => {
      const existing = makePaymentDto({ id: 'existing-pay' });
      (mockBillingService.createPayment as jest.Mock).mockResolvedValue(existing);

      const response = await controller.create(makeRequest('tenant-uuid'), {
        amount_cents: 5000,
        currency: 'BRL',
        payment_method: 'card',
        idempotency_key: 'existing-key',
      });

      expect(response.id).toBe('existing-pay');
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

    it('allows tenant_admin role', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['supervisor', 'tenant_admin']),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'u', tenantId: 't', roles: ['tenant_admin'] } }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});

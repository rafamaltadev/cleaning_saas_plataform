import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PublicPaymentController } from './public-payment.controller';
import { PublicPaymentService } from './public-payment.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

function makeRequest(userId: string, roles: string[] = ['client']): Request & { user?: AuthUser } {
  return { user: { userId, tenantId: 'tenant-uuid', roles } } as any;
}

const mockPublicPaymentService = {
  createPublicPaymentIntent: jest.fn(),
  getMyPayments: jest.fn(),
} as unknown as PublicPaymentService;

describe('PublicPaymentController', () => {
  let controller: PublicPaymentController;

  beforeEach(() => {
    controller = new PublicPaymentController(mockPublicPaymentService);
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    const dto = { booking_id: '550e8400-e29b-41d4-a716-446655440000' };

    it('returns client_secret, publishable_key, payment_methods on success', async () => {
      const expected = {
        clientSecret: 'pi_secret_xxx',
        publishableKey: 'pk_test_xxx',
        paymentMethods: ['card', 'pix'],
      };
      (mockPublicPaymentService.createPublicPaymentIntent as jest.Mock).mockResolvedValue(expected);

      const result = await controller.createPaymentIntent('tenant-slug', dto, makeRequest('user-1'));

      expect(mockPublicPaymentService.createPublicPaymentIntent).toHaveBeenCalledWith({
        tenantSlug: 'tenant-slug',
        bookingId: dto.booking_id,
        userId: 'user-1',
      });
      expect(result).toEqual(expected);
    });

    it('rejects when booking belongs to different client (ForbiddenException)', async () => {
      (mockPublicPaymentService.createPublicPaymentIntent as jest.Mock).mockRejectedValue(
        new ForbiddenException({ code: 'BOOKING_ACCESS_DENIED', message: 'Not your booking' }),
      );

      await expect(
        controller.createPaymentIntent('tenant-slug', dto, makeRequest('other-user')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when tenant payment_mode is manual (BadRequestException)', async () => {
      (mockPublicPaymentService.createPublicPaymentIntent as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'MANUAL_PAYMENT_MODE', message: 'Manual mode' }),
      );

      await expect(
        controller.createPaymentIntent('tenant-slug', dto, makeRequest('user-1')),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects for unknown tenant (NotFoundException)', async () => {
      (mockPublicPaymentService.createPublicPaymentIntent as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Not found' }),
      );

      await expect(
        controller.createPaymentIntent('bad-slug', dto, makeRequest('user-1')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyPayments', () => {
    it('returns list of payments for authenticated client', async () => {
      const mockPayments = [{ id: 'pay-1', status: 'succeeded' }];
      (mockPublicPaymentService.getMyPayments as jest.Mock).mockResolvedValue(mockPayments);

      const result = await controller.getMyPayments('tenant-slug', makeRequest('user-1'));

      expect(mockPublicPaymentService.getMyPayments).toHaveBeenCalledWith('tenant-slug', 'user-1');
      expect(result).toEqual(mockPayments);
    });
  });
});

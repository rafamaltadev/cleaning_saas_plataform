import { NotFoundException } from '@nestjs/common';
import { PaymentConfigController } from './payment-config.controller';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

function makeRequest(tenantId: string): Request & { user?: AuthUser } {
  return {
    user: { userId: 'user-uuid', tenantId, roles: ['tenant_admin'] },
  } as any;
}

const mockTenantRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockAuditRepo = {
  save: jest.fn().mockResolvedValue({}),
};

const mockDataSource = {
  getRepository: jest.fn(() => ({ ...mockTenantRepo, ...mockAuditRepo })),
} as unknown as DataSource;

describe('PaymentConfigController', () => {
  let controller: PaymentConfigController;

  beforeEach(() => {
    controller = new PaymentConfigController(mockDataSource);
    jest.clearAllMocks();
    mockAuditRepo.save.mockResolvedValue({});

    mockDataSource.getRepository = jest.fn((entity: any) => {
      if (entity?.name === 'AuditLog') return mockAuditRepo as any;
      return mockTenantRepo as any;
    });
    (controller as any).dataSource = mockDataSource;
  });

  describe('updatePaymentConfig', () => {
    it('throws NotFoundException when tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);

      await expect(
        controller.updatePaymentConfig(makeRequest('tenant-uuid'), {
          payment_mode: 'automatic',
          payment_timing: 'prepaid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates payment config and returns new values', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-uuid',
        payment_mode: 'manual',
        payment_timing: 'prepaid',
      });
      mockTenantRepo.update.mockResolvedValue({ affected: 1 });

      const result = await controller.updatePaymentConfig(makeRequest('tenant-uuid'), {
        payment_mode: 'automatic',
        payment_timing: 'postpaid',
      });

      expect(result.payment_mode).toBe('automatic');
      expect(result.payment_timing).toBe('postpaid');
    });
  });
});

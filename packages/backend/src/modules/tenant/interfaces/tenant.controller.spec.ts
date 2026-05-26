import { TenantController } from './tenant.controller';
import { TenantService } from '../application/tenant.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

const mockTenantService = {
  getById: jest.fn(),
  update: jest.fn(),
} as unknown as TenantService;

function makeRequest(tenantId: string): Request & { user?: AuthUser } {
  return { user: { userId: 'actor-uuid', tenantId, roles: ['tenant_admin'] } } as any;
}

describe('TenantController', () => {
  let controller: TenantController;

  beforeEach(() => {
    controller = new TenantController(mockTenantService);
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('delegates to tenantService.getById with the tenantId from request', async () => {
      const dto = { id: 'tenant-uuid', name: 'Acme', email: 'tenant1@seed.local', stripe_customer_id: 'cus_test_fixture_1', subscription_plan: 'basic', currency: 'BRL', timezone: 'UTC', created_at: new Date(), updated_at: new Date() };
      (mockTenantService.getById as jest.Mock).mockResolvedValue(dto);

      const result = await controller.getMe(makeRequest('tenant-uuid'));

      expect(mockTenantService.getById).toHaveBeenCalledWith('tenant-uuid');
      expect(result).toBe(dto);
    });
  });

  describe('updateMe', () => {
    it('delegates to tenantService.update with tenantId and dto', async () => {
      const dto = { timezone: 'UTC' };
      const response = { id: 'tenant-uuid', name: 'Acme', email: 'tenant2@seed.local', stripe_customer_id: 'cus_test_fixture_2', subscription_plan: 'basic', currency: 'BRL', timezone: 'UTC', created_at: new Date(), updated_at: new Date() };
      (mockTenantService.update as jest.Mock).mockResolvedValue(response);

      const result = await controller.updateMe(makeRequest('tenant-uuid'), dto);

      expect(mockTenantService.update).toHaveBeenCalledWith('tenant-uuid', dto);
      expect(result).toBe(response);
    });
  });
});

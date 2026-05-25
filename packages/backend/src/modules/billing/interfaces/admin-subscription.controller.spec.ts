import { ForbiddenException } from '@nestjs/common';
import { AdminSubscriptionController } from './admin-subscription.controller';
import { SubscriptionPlanService } from '../subscriptions/subscription-plan.service';
import { TenantSubscriptionService } from '../subscriptions/tenant-subscription.service';

const mockPlanService = {
  findAllPlans: jest.fn(),
  createPlan: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn(),
} as unknown as SubscriptionPlanService;

const mockSubService = {
  getAllSubscriptions: jest.fn(),
} as unknown as TenantSubscriptionService;

describe('AdminSubscriptionController', () => {
  let controller: AdminSubscriptionController;

  beforeEach(() => {
    controller = new AdminSubscriptionController(mockPlanService, mockSubService);
    jest.clearAllMocks();
  });

  describe('listPlans', () => {
    it('delegates to planService.findAllPlans', async () => {
      const plans = [{ id: 'plan-uuid', name: 'Basic' }];
      (mockPlanService.findAllPlans as jest.Mock).mockResolvedValue(plans);

      const result = await controller.listPlans();
      expect(result).toBe(plans);
    });
  });

  describe('createPlan', () => {
    it('delegates to planService.createPlan with dto', async () => {
      const dto = {
        name: 'Pro',
        tier: 'pro',
        interval: 'month' as const,
        interval_count: 1,
        amount_cents: 19900,
        currency: 'BRL' as const,
      };
      const plan = { id: 'plan-uuid', ...dto };
      (mockPlanService.createPlan as jest.Mock).mockResolvedValue(plan);

      const result = await controller.createPlan(dto);
      expect(mockPlanService.createPlan).toHaveBeenCalledWith(dto);
      expect(result).toBe(plan);
    });
  });

  describe('deletePlan', () => {
    it('delegates to planService.deletePlan', async () => {
      (mockPlanService.deletePlan as jest.Mock).mockResolvedValue(undefined);
      await controller.deletePlan('plan-uuid');
      expect(mockPlanService.deletePlan).toHaveBeenCalledWith('plan-uuid');
    });
  });

  describe('listSubscriptions', () => {
    it('passes filters to subscriptionService.getAllSubscriptions', async () => {
      (mockSubService.getAllSubscriptions as jest.Mock).mockResolvedValue([]);
      await controller.listSubscriptions('active', 'tenant-uuid');
      expect(mockSubService.getAllSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', tenantId: 'tenant-uuid' }),
      );
    });
  });
});

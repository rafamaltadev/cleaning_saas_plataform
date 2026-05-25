import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { DataSource } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { TenantSubscription } from './tenant-subscription.entity';

function makePlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
  return {
    id: 'plan-uuid',
    name: 'Basic Monthly',
    description: null,
    tier: 'basic',
    stripe_price_id: 'price_test123',
    interval: 'month',
    interval_count: 1,
    amount_cents: 9900,
    currency: 'BRL',
    is_active: true,
    valid_from: new Date(),
    valid_until: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

const mockPlanRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
};

const mockSubRepo = {
  count: jest.fn(),
};

const mockManager = {
  save: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn().mockImplementation((entity: any) => {
    if (entity === SubscriptionPlan) return mockPlanRepo;
    if (entity === TenantSubscription) return mockSubRepo;
    return mockPlanRepo;
  }),
  transaction: jest.fn().mockImplementation((cb: any) => cb(mockManager)),
} as unknown as DataSource;

const mockStripeService = {
  createPrice: jest.fn(),
} as unknown as StripePlatformService;

describe('SubscriptionPlanService', () => {
  let service: SubscriptionPlanService;

  beforeEach(() => {
    service = new SubscriptionPlanService(mockDataSource, mockStripeService);
    jest.clearAllMocks();
    mockDataSource.getRepository = jest.fn().mockImplementation((entity: any) => {
      if (entity === SubscriptionPlan) return mockPlanRepo;
      if (entity === TenantSubscription) return mockSubRepo;
      return mockPlanRepo;
    });
  });

  describe('createPlan', () => {
    it('rolls back DB if Stripe price creation fails', async () => {
      (mockStripeService.createPrice as jest.Mock).mockRejectedValue(new Error('Stripe error'));

      await expect(
        service.createPlan({
          name: 'Pro',
          tier: 'pro',
          interval: 'month',
          interval_count: 1,
          amount_cents: 19900,
          currency: 'BRL',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('creates plan atomically when Stripe succeeds', async () => {
      const mockPrice = { id: 'price_new123' };
      (mockStripeService.createPrice as jest.Mock).mockResolvedValue(mockPrice);
      mockManager.save.mockResolvedValue(makePlan({ stripe_price_id: 'price_new123' }));

      const result = await service.createPlan({
        name: 'Pro',
        tier: 'pro',
        interval: 'month',
        interval_count: 1,
        amount_cents: 19900,
        currency: 'BRL',
      });

      expect(mockManager.save).toHaveBeenCalledWith(
        SubscriptionPlan,
        expect.objectContaining({ stripe_price_id: 'price_new123' }),
      );
    });
  });

  describe('deletePlan', () => {
    it('throws if plan has active subscriptions', async () => {
      mockPlanRepo.findOne.mockResolvedValue(makePlan());
      mockSubRepo.count.mockResolvedValue(2);

      await expect(service.deletePlan('plan-uuid')).rejects.toThrow(BadRequestException);
    });

    it('soft deletes plan when no active subscriptions', async () => {
      const plan = makePlan();
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockSubRepo.count.mockResolvedValue(0);
      mockPlanRepo.save.mockResolvedValue({ ...plan, is_active: false, deleted_at: new Date() });

      await service.deletePlan('plan-uuid');
      expect(mockPlanRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });
});

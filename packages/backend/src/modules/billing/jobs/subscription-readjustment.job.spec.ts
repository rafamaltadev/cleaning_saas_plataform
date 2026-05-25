import { SubscriptionReadjustmentJob } from './subscription-readjustment.job';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { DataSource } from 'typeorm';
import { TenantSubscription } from '../subscriptions/tenant-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/subscription-plan.entity';
import { SubscriptionPriceHistory } from '../subscriptions/subscription-price-history.entity';
import * as stripeConfig from '../../../config/stripe.config';

jest.spyOn(stripeConfig, 'getStripeClient').mockReturnValue({} as any);

function makeSub(overrides: Partial<TenantSubscription> = {}): TenantSubscription {
  return {
    id: 'sub-uuid',
    tenant_id: 'tenant-uuid',
    plan_id: 'plan-uuid',
    stripe_subscription_id: 'sub_test123',
    stripe_customer_id: 'cus_test123',
    status: 'active',
    current_period_start: new Date(),
    current_period_end: new Date(),
    cancel_at_period_end: false,
    canceled_at: null,
    trial_ends_at: null,
    grandfathered_price_cents: 9000,
    discount_ratio: 0.1,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const mockSubRepo = { find: jest.fn(), save: jest.fn() };
const mockPlanRepo = { findOne: jest.fn() };
const mockHistoryRepo = { save: jest.fn() };

const mockDataSource = {
  getRepository: jest.fn().mockImplementation((entity: any) => {
    if (entity === TenantSubscription) return mockSubRepo;
    if (entity === SubscriptionPlan) return mockPlanRepo;
    if (entity === SubscriptionPriceHistory) return mockHistoryRepo;
    return mockSubRepo;
  }),
} as unknown as DataSource;

const mockStripeService = {
  createPrice: jest.fn(),
  updateSubscription: jest.fn(),
} as unknown as StripePlatformService;

describe('SubscriptionReadjustmentJob', () => {
  let job: SubscriptionReadjustmentJob;

  beforeEach(() => {
    job = new SubscriptionReadjustmentJob(mockDataSource, mockStripeService);
    jest.clearAllMocks();
    (stripeConfig.getStripeClient as jest.Mock).mockReturnValue({});
  });

  describe('runReadjustment', () => {
    it('preserves discount_ratio when applying new price', async () => {
      // Sub was paying 8100 (10% off original 9000), plan raised to 10000
      // New effective price = 10000 * 0.9 = 9000 ≠ 8100 → readjustment fires
      const sub = makeSub({ grandfathered_price_cents: 8100, discount_ratio: 0.1 });
      const plan = {
        id: 'plan-uuid',
        name: 'Basic',
        amount_cents: 10000,
        currency: 'BRL',
        interval: 'month',
        interval_count: 1,
        tier: 'basic',
      };

      mockSubRepo.find.mockResolvedValue([sub]);
      mockPlanRepo.findOne.mockResolvedValue(plan);
      (mockStripeService.createPrice as jest.Mock).mockResolvedValue({ id: 'price_new' });
      (mockStripeService.updateSubscription as jest.Mock).mockResolvedValue({});
      mockHistoryRepo.save.mockResolvedValue({});
      mockSubRepo.save.mockResolvedValue({});

      await job.runReadjustment();

      expect(mockStripeService.createPrice).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 9000 }),
      );
    });

    it('creates price_history record with notified_at=NULL', async () => {
      const sub = makeSub({ grandfathered_price_cents: 9000, discount_ratio: 0.1 });
      const plan = {
        id: 'plan-uuid',
        name: 'Basic',
        amount_cents: 11000,
        currency: 'BRL',
        interval: 'month',
        interval_count: 1,
        tier: 'basic',
      };

      mockSubRepo.find.mockResolvedValue([sub]);
      mockPlanRepo.findOne.mockResolvedValue(plan);
      (mockStripeService.createPrice as jest.Mock).mockResolvedValue({ id: 'price_new' });
      (mockStripeService.updateSubscription as jest.Mock).mockResolvedValue({});
      mockHistoryRepo.save.mockResolvedValue({});
      mockSubRepo.save.mockResolvedValue({});

      await job.runReadjustment();

      expect(mockHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          notified_at: null,
          reason: 'annual_readjustment',
          discount_ratio_preserved: 0.1,
        }),
      );
    });
  });
});

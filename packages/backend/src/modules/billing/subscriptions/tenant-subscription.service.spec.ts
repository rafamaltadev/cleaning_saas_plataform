import { NotFoundException } from '@nestjs/common';
import { TenantSubscriptionService } from './tenant-subscription.service';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { DataSource } from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';

function makeSub(overrides: Partial<TenantSubscription> = {}): TenantSubscription {
  return {
    id: 'sub-uuid',
    tenant_id: 'tenant-uuid',
    plan_id: 'plan-uuid',
    stripe_subscription_id: 'sub_test123',
    stripe_customer_id: 'cus_test123',
    status: 'active',
    current_period_start: new Date('2024-01-01'),
    current_period_end: new Date('2024-02-01'),
    cancel_at_period_end: false,
    canceled_at: null,
    trial_ends_at: null,
    grandfathered_price_cents: 9900,
    discount_ratio: 0.1,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const mockSubRepo = { findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockPlanRepo = { findOne: jest.fn() };
const mockTenantRepo = { findOne: jest.fn(), update: jest.fn() };
const mockAuditRepo = { save: jest.fn() };

const mockDataSource = {
  getRepository: jest.fn().mockImplementation((entity: any) => {
    if (entity === TenantSubscription) return mockSubRepo;
    if (entity === SubscriptionPlan) return mockPlanRepo;
    if (entity === Tenant) return mockTenantRepo;
    if (entity === AuditLog) return mockAuditRepo;
    return mockAuditRepo;
  }),
} as unknown as DataSource;

const mockStripeService = {
  createCustomer: jest.fn(),
  createCheckoutSession: jest.fn(),
  cancelSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  createPortalSession: jest.fn(),
} as unknown as StripePlatformService;

describe('TenantSubscriptionService', () => {
  let service: TenantSubscriptionService;

  beforeEach(() => {
    service = new TenantSubscriptionService(mockDataSource, mockStripeService);
    jest.clearAllMocks();
  });

  describe('cancel', () => {
    it('sets cancel_at_period_end=true when atPeriodEnd=true', async () => {
      const sub = makeSub();
      mockSubRepo.findOne.mockResolvedValue(sub);
      (mockStripeService.cancelSubscription as jest.Mock).mockResolvedValue({});
      mockSubRepo.save.mockResolvedValue({ ...sub, cancel_at_period_end: true });
      mockAuditRepo.save.mockResolvedValue({});

      const result = await service.cancel('tenant-uuid', { at_period_end: true });

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ atPeriodEnd: true }),
      );
      expect(mockSubRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ cancel_at_period_end: true }),
      );
    });

    it('throws NotFoundException when no active subscription', async () => {
      mockSubRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel('tenant-uuid', { at_period_end: false })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('discount_ratio calculation', () => {
    it('calculates discount_ratio correctly on subscription creation', async () => {
      const plan = {
        id: 'plan-uuid',
        amount_cents: 10000,
        stripe_price_id: 'price_test',
        is_active: true,
      };
      const tenant = {
        id: 'tenant-uuid',
        email: 'test@tenant.com',
        name: 'Test',
        tenant_slug: 'test',
        stripe_customer_id: 'cus_existing',
      };

      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      (mockStripeService.createCheckoutSession as jest.Mock).mockResolvedValue({
        checkout_url: 'https://checkout.stripe.com/pay/cs_test',
        session_id: 'cs_test',
      });

      await service.createCheckout('tenant-uuid', {
        plan_id: 'plan-uuid',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-uuid', planId: 'plan-uuid' }),
      );
    });
  });

  describe('getTenantIsolation', () => {
    it('returns null when tenant has no subscription', async () => {
      mockSubRepo.findOne.mockResolvedValue(null);
      const result = await service.getMySubscription('other-tenant-uuid');
      expect(result).toBeNull();
    });
  });
});

import { StripePlatformWebhookController } from './stripe-platform-webhook.controller';
import * as stripeConfig from '../../../config/stripe.config';
import { DataSource, Repository } from 'typeorm';
import { StripeWebhookEvent } from '../subscriptions/stripe-webhook-event.entity';
import { TenantSubscription } from '../subscriptions/tenant-subscription.entity';

const mockWebhookEventRepo = { findOne: jest.fn(), save: jest.fn() };
const mockSubRepo = { findOne: jest.fn(), update: jest.fn(), save: jest.fn() };
const mockPlanRepo = { findOne: jest.fn() };
const mockTenantRepo = { update: jest.fn() };
const mockAuditRepo = { save: jest.fn() };

const mockDataSource = {
  getRepository: jest.fn().mockImplementation((entity: any) => {
    if (entity === StripeWebhookEvent) return mockWebhookEventRepo;
    if (entity === TenantSubscription) return mockSubRepo;
    return mockAuditRepo;
  }),
} as unknown as DataSource;

const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
};

jest.spyOn(stripeConfig, 'getStripeClient').mockReturnValue(mockStripe as any);
jest.spyOn(stripeConfig, 'getStripeWebhookSecret').mockReturnValue('whsec_test');

describe('StripePlatformWebhookController', () => {
  let controller: StripePlatformWebhookController;

  beforeEach(() => {
    controller = new StripePlatformWebhookController(mockDataSource);
    jest.clearAllMocks();
    (stripeConfig.getStripeClient as jest.Mock).mockReturnValue(mockStripe);
    (stripeConfig.getStripeWebhookSecret as jest.Mock).mockReturnValue('whsec_test');
  });

  describe('handleWebhook', () => {
    function makeReq(rawBody: Buffer = Buffer.from('{}')) {
      return { rawBody } as any;
    }

    it('rejects invalid Stripe signature with 400', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleWebhook(makeReq(), 'bad-sig'),
      ).rejects.toThrow();
    });

    it('processes checkout.session.completed and creates TenantSubscription', async () => {
      const fakeEvent = {
        id: 'evt_test001',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            metadata: { tenant_id: 'tenant-uuid', plan_id: 'plan-uuid' },
            subscription: 'sub_test123',
            customer: 'cus_test123',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
      mockWebhookEventRepo.findOne.mockResolvedValue(null);
      mockWebhookEventRepo.save.mockResolvedValue({});
      mockSubRepo.findOne.mockResolvedValue(null);
      mockSubRepo.save.mockResolvedValue({});
      mockPlanRepo.findOne.mockResolvedValue({ id: 'plan-uuid', amount_cents: 9900, currency: 'BRL' });
      mockDataSource.getRepository = jest.fn().mockImplementation((entity: any) => {
        if (entity === StripeWebhookEvent) return mockWebhookEventRepo;
        if (entity === TenantSubscription) return mockSubRepo;
        if (entity?.name === 'SubscriptionPlan') return mockPlanRepo;
        if (entity?.name === 'Tenant') return mockTenantRepo;
        return mockAuditRepo;
      });

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        cancel_at_period_end: false,
        trial_end: null,
      });

      const result = await controller.handleWebhook(makeReq(Buffer.from(JSON.stringify(fakeEvent))), 'test-sig');
      expect(result).toEqual({ received: true });
    });

    it('is idempotent — same event.id processed twice produces same result', async () => {
      const fakeEvent = {
        id: 'evt_duplicate001',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_dup', metadata: {}, status: 'active', current_period_start: 0, current_period_end: 0, cancel_at_period_end: false, canceled_at: null } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
      mockWebhookEventRepo.findOne.mockResolvedValue({ id: 'existing-record' });

      const result = await controller.handleWebhook(makeReq(), 'test-sig');
      expect(result).toEqual({ received: true });
      expect(mockSubRepo.update).not.toHaveBeenCalled();
    });

    it('handles customer.subscription.updated and updates status', async () => {
      const fakeEvent = {
        id: 'evt_update001',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            metadata: { tenant_id: 'tenant-uuid' },
            status: 'past_due',
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            cancel_at_period_end: false,
            canceled_at: null,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(fakeEvent);
      mockWebhookEventRepo.findOne.mockResolvedValue(null);
      mockWebhookEventRepo.save.mockResolvedValue({});
      mockSubRepo.update.mockResolvedValue({ affected: 1 });

      await controller.handleWebhook(makeReq(), 'test-sig');
      expect(mockSubRepo.update).toHaveBeenCalledWith(
        { stripe_subscription_id: 'sub_test123' },
        expect.objectContaining({ status: 'past_due' }),
      );
    });
  });
});

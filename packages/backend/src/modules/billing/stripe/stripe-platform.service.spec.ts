import { StripePlatformService } from './stripe-platform.service';
import { DataSource } from 'typeorm';
import * as stripeConfig from '../../../config/stripe.config';

const mockStripe = {
  customers: { create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  subscriptions: {
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  },
  billingPortal: { sessions: { create: jest.fn() } },
  products: { create: jest.fn() },
  prices: { create: jest.fn() },
};

const mockDataSource = {
  getRepository: jest.fn().mockReturnValue({ save: jest.fn() }),
} as unknown as DataSource;

jest.spyOn(stripeConfig, 'getStripeClient').mockReturnValue(mockStripe as any);

describe('StripePlatformService', () => {
  let service: StripePlatformService;

  beforeEach(() => {
    service = new StripePlatformService(mockDataSource);
    jest.clearAllMocks();
    (stripeConfig.getStripeClient as jest.Mock).mockReturnValue(mockStripe);
  });

  describe('createCustomer', () => {
    it('creates a Stripe customer with tenant metadata', async () => {
      const mockCustomer = { id: 'cus_test123', email: 'tenant@test.com' };
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const tenant = {
        id: 'tenant-uuid',
        name: 'Test Tenant',
        email: 'tenant@test.com',
        tenant_slug: 'test-tenant',
        stripe_customer_id: null,
      } as any;

      const result = await service.createCustomer(tenant);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'tenant@test.com',
        name: 'Test Tenant',
        metadata: { tenant_id: 'tenant-uuid', tenant_slug: 'test-tenant' },
      });
      expect(result).toBe(mockCustomer);
    });
  });

  describe('createCheckoutSession', () => {
    it('creates a checkout session with correct line items and returns URL and session_id', async () => {
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/cs_test123',
      };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await service.createCheckoutSession({
        tenantId: 'tenant-uuid',
        planId: 'plan-uuid',
        stripePriceId: 'price_test123',
        customerId: 'cus_test123',
        successUrl: 'https://app.example.com/success',
        cancelUrl: 'https://app.example.com/cancel',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_test123',
          line_items: [{ price: 'price_test123', quantity: 1 }],
          success_url: 'https://app.example.com/success',
          cancel_url: 'https://app.example.com/cancel',
        }),
      );
      expect(result).toEqual({ checkout_url: mockSession.url, session_id: mockSession.id });
    });
  });
});

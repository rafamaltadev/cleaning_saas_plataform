import { StripeConnectService } from './stripe-connect.service';
import { InternalServerErrorException } from '@nestjs/common';

const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    del: jest.fn(),
    createLoginLink: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
};

describe('StripeConnectService', () => {
  let service: StripeConnectService;

  beforeEach(() => {
    service = new StripeConnectService();
    jest.clearAllMocks();
    process.env.STRIPE_PLATFORM_SECRET_KEY = 'sk_test_fake';
    // Override getStripe to return our mock
    (service as any).getStripe = () => mockStripe;
  });

  afterEach(() => {
    delete process.env.STRIPE_PLATFORM_SECRET_KEY;
    jest.restoreAllMocks();
  });

  describe('createConnectAccount', () => {
    it('creates an Express account with tenant metadata', async () => {
      const mockAccount = {
        id: 'acct_test123',
        type: 'express',
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        metadata: { tenant_id: 'tenant-uuid' },
      };
      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await service.createConnectAccount({
        tenantId: 'tenant-uuid',
        country: 'BR',
        email: 'test@tenant.com',
      });

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'BR',
          email: 'test@tenant.com',
          metadata: { tenant_id: 'tenant-uuid' },
        }),
      );
      expect(result).toEqual(mockAccount);
    });

    it('propagates errors from stripe', async () => {
      mockStripe.accounts.create.mockRejectedValue(new Error('Stripe error'));

      await expect(
        service.createConnectAccount({ tenantId: 'tenant-uuid', country: 'BR', email: 'test@test.com' }),
      ).rejects.toThrow('Stripe error');
    });
  });

  describe('when STRIPE_PLATFORM_SECRET_KEY is missing', () => {
    it('throws InternalServerErrorException', () => {
      delete process.env.STRIPE_PLATFORM_SECRET_KEY;
      const freshService = new StripeConnectService();
      expect(() => (freshService as any).getStripe()).toThrow(InternalServerErrorException);
    });
  });

  describe('createAccountLink', () => {
    it('creates an account link with return and refresh URLs', async () => {
      const mockLink = { url: 'https://connect.stripe.com/setup/e/acct_test123', expires_at: 1700000000 };
      mockStripe.accountLinks.create.mockResolvedValue(mockLink);

      const result = await service.createAccountLink({
        accountId: 'acct_test123',
        returnUrl: 'http://localhost:5173/settings/payments/connected',
        refreshUrl: 'http://localhost:5173/settings/payments/refresh',
        type: 'account_onboarding',
      });

      expect(result).toEqual(mockLink);
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test123',
        return_url: 'http://localhost:5173/settings/payments/connected',
        refresh_url: 'http://localhost:5173/settings/payments/refresh',
        type: 'account_onboarding',
      });
    });
  });

  describe('retrieveAccount', () => {
    it('retrieves account by id', async () => {
      const mockAccount = { id: 'acct_test123', charges_enabled: true };
      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await service.retrieveAccount('acct_test123');
      expect(result).toEqual(mockAccount);
      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith('acct_test123');
    });
  });

  describe('createLoginLink', () => {
    it('creates a login link for the given account', async () => {
      const mockLink = { url: 'https://express.stripe.com/acct_test123' };
      mockStripe.accounts.createLoginLink.mockResolvedValue(mockLink);

      const result = await service.createLoginLink('acct_test123');
      expect(result).toEqual(mockLink);
    });
  });

  describe('disconnectAccount', () => {
    it('calls stripe.accounts.del with the account id', async () => {
      mockStripe.accounts.del.mockResolvedValue({ id: 'acct_test123', deleted: true });

      await expect(service.disconnectAccount('acct_test123')).resolves.not.toThrow();
      expect(mockStripe.accounts.del).toHaveBeenCalledWith('acct_test123');
    });

    it('propagates errors from stripe', async () => {
      mockStripe.accounts.del.mockRejectedValue(new Error('Delete failed'));

      await expect(service.disconnectAccount('acct_test123')).rejects.toThrow('Delete failed');
    });
  });
});

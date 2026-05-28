import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConnectController } from './connect.controller';
import { StripeConnectService } from '../stripe/stripe-connect.service';
import { StripeTermsService } from '../connect/stripe-terms.service';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

function makeRequest(tenantId: string, userId = 'user-uuid'): Request & { user?: AuthUser } {
  return {
    user: { userId, tenantId, roles: ['tenant_admin'] },
    headers: { 'user-agent': 'TestAgent' },
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
}

const mockConnectService = {
  createConnectAccount: jest.fn(),
  createAccountLink: jest.fn(),
  retrieveAccount: jest.fn(),
  createLoginLink: jest.fn(),
  disconnectAccount: jest.fn(),
} as unknown as StripeConnectService;

const mockTermsService = {
  getCurrentTerms: jest.fn(),
  recordConsent: jest.fn(),
  hasValidConsent: jest.fn(),
} as unknown as StripeTermsService;

const mockTenantRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockAuditRepo = {
  save: jest.fn().mockResolvedValue({}),
};

const mockDataSource = {
  getRepository: jest.fn((entity: any) => {
    if (entity?.name === 'Tenant' || String(entity).includes('Tenant')) return mockTenantRepo;
    return mockAuditRepo;
  }),
} as unknown as DataSource;

describe('ConnectController', () => {
  let controller: ConnectController;

  beforeEach(() => {
    controller = new ConnectController(
      mockConnectService,
      mockTermsService,
      mockDataSource,
    );
    jest.clearAllMocks();
    mockAuditRepo.save.mockResolvedValue({});
  });

  describe('getTerms', () => {
    it('returns terms for country/language', async () => {
      const terms = { id: 'terms-uuid', version: 'v1.0', country: 'BR' };
      (mockTermsService.getCurrentTerms as jest.Mock).mockResolvedValue(terms);

      const result = await controller.getTerms('BR', 'pt-BR');

      expect(result).toEqual(terms);
      expect(mockTermsService.getCurrentTerms).toHaveBeenCalledWith({ country: 'BR', language: 'pt-BR' });
    });

    it('throws NotFoundException when no terms found', async () => {
      (mockTermsService.getCurrentTerms as jest.Mock).mockResolvedValue(null);

      await expect(controller.getTerms('XX', 'zz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptTerms', () => {
    it('records consent and returns consent id', async () => {
      const consent = { id: 'consent-uuid', accepted_at: new Date() };
      (mockTermsService.recordConsent as jest.Mock).mockResolvedValue(consent);

      const req = makeRequest('tenant-uuid');
      const result = await controller.acceptTerms(req, { terms_version: 'v1.0' });

      expect(result.id).toBe('consent-uuid');
      expect(mockTermsService.recordConsent).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-uuid', termsVersion: 'v1.0' }),
      );
    });
  });

  describe('startOnboarding', () => {
    it('throws ForbiddenException when consent not valid', async () => {
      (mockTermsService.hasValidConsent as jest.Mock).mockResolvedValue(false);

      await expect(
        controller.startOnboarding(makeRequest('tenant-uuid'), { country: 'BR', email: 'test@test.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates account and returns onboarding URL', async () => {
      (mockTermsService.hasValidConsent as jest.Mock).mockResolvedValue(true);
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-uuid',
        stripe_connect_account_id: null,
      });
      (mockConnectService.createConnectAccount as jest.Mock).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: false,
      });
      mockTenantRepo.update.mockResolvedValue({ affected: 1 });
      (mockConnectService.createAccountLink as jest.Mock).mockResolvedValue({
        url: 'https://connect.stripe.com/setup/e/acct_test123',
      });

      const result = await controller.startOnboarding(
        makeRequest('tenant-uuid'),
        { country: 'BR', email: 'test@test.com' },
      );

      expect(result.url).toContain('connect.stripe.com');
    });
  });

  describe('getStatus', () => {
    it('returns not connected when tenant has no account', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-uuid',
        stripe_connect_account_id: null,
        payment_mode: 'manual',
        payment_timing: 'prepaid',
      });

      const result = await controller.getStatus(makeRequest('tenant-uuid'));

      expect(result.connected).toBe(false);
    });
  });

  describe('getDashboardLink', () => {
    it('throws NotFoundException when no connect account', async () => {
      mockTenantRepo.findOne.mockResolvedValue({ stripe_connect_account_id: null });

      await expect(controller.getDashboardLink(makeRequest('tenant-uuid'))).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnect', () => {
    it('disconnects account and clears tenant fields', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-uuid',
        stripe_connect_account_id: 'acct_test123',
      });
      (mockConnectService.disconnectAccount as jest.Mock).mockResolvedValue(undefined);
      mockTenantRepo.update.mockResolvedValue({ affected: 1 });

      const result = await controller.disconnect(makeRequest('tenant-uuid'));

      expect(result.disconnected).toBe(true);
      expect(mockConnectService.disconnectAccount).toHaveBeenCalledWith('acct_test123');
    });
  });
});

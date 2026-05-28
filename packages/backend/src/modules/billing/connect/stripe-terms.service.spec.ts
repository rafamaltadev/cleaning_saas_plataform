import { StripeTermsService } from './stripe-terms.service';
import { StripeTermsVersion } from './stripe-terms-version.entity';
import { TenantStripeConsent } from './tenant-stripe-consent.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { Repository } from 'typeorm';

function makeTerms(overrides: Partial<StripeTermsVersion> = {}): StripeTermsVersion {
  const t = new StripeTermsVersion();
  t.id = 'terms-uuid';
  t.version = 'v1.0-BR-pt-BR';
  t.country = 'BR';
  t.language = 'pt-BR';
  t.content = 'Terms content';
  t.platform_fee_percent = 1;
  t.stripe_fee_card_percent = 3.99;
  t.stripe_fee_pix_percent = 0.99;
  t.stripe_fee_ach_percent = null;
  t.effective_from = new Date('2024-01-01');
  t.effective_until = null;
  t.created_at = new Date();
  return Object.assign(t, overrides);
}

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-uuid',
    name: 'Test',
    email: 'test@tenant.local',
    subscription_plan: 'basic',
    stripe_customer_id: null,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    tenant_slug: 'test',
    logo_url: null,
    primary_color: null,
    favicon_url: null,
    description: null,
    phone: null,
    social_links: null,
    google_maps_embed_url: null,
    public_address: null,
    stripe_connect_account_id: null,
    stripe_connect_status: null,
    stripe_connect_charges_enabled: false,
    stripe_connect_payouts_enabled: false,
    stripe_connect_requirements: null,
    stripe_connect_country: 'BR',
    payment_mode: 'manual',
    payment_timing: 'prepaid',
    stripe_terms_accepted_version: null,
    stripe_terms_accepted_at: null,
    stripe_terms_accepted_ip: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Tenant;
}

describe('StripeTermsService', () => {
  let service: StripeTermsService;
  let termsRepo: jest.Mocked<Pick<Repository<StripeTermsVersion>, 'findOne'>>;
  let consentRepo: jest.Mocked<Pick<Repository<TenantStripeConsent>, 'save'>>;
  let tenantRepo: jest.Mocked<Pick<Repository<Tenant>, 'findOne' | 'update'>>;

  beforeEach(() => {
    termsRepo = { findOne: jest.fn() };
    consentRepo = { save: jest.fn() };
    tenantRepo = { findOne: jest.fn(), update: jest.fn() };

    service = new StripeTermsService(
      termsRepo as unknown as Repository<StripeTermsVersion>,
      consentRepo as unknown as Repository<TenantStripeConsent>,
      tenantRepo as unknown as Repository<Tenant>,
    );
  });

  describe('getCurrentTerms', () => {
    it('returns active terms for country/language', async () => {
      const terms = makeTerms();
      termsRepo.findOne.mockResolvedValue(terms);

      const result = await service.getCurrentTerms({ country: 'BR', language: 'pt-BR' });

      expect(result).toEqual(terms);
    });

    it('returns null when no terms exist', async () => {
      termsRepo.findOne.mockResolvedValue(null);

      const result = await service.getCurrentTerms({ country: 'US', language: 'en' });

      expect(result).toBeNull();
    });

    it('returns null when terms have expired', async () => {
      const expiredTerms = makeTerms({ effective_until: new Date('2020-01-01') });
      termsRepo.findOne.mockResolvedValue(expiredTerms);

      const result = await service.getCurrentTerms({ country: 'BR', language: 'pt-BR' });

      expect(result).toBeNull();
    });
  });

  describe('recordConsent', () => {
    it('saves consent and updates tenant fields', async () => {
      const mockConsent = {
        id: 'consent-uuid',
        tenant_id: 'tenant-uuid',
        terms_version: 'v1.0-BR-pt-BR',
        accepted_at: new Date(),
        accepted_ip: '127.0.0.1',
        accepted_user_agent: 'TestAgent',
        accepted_by_user_id: 'user-uuid',
      } as TenantStripeConsent;
      consentRepo.save.mockResolvedValue(mockConsent);
      tenantRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.recordConsent({
        tenantId: 'tenant-uuid',
        termsVersion: 'v1.0-BR-pt-BR',
        ip: '127.0.0.1',
        userAgent: 'TestAgent',
        userId: 'user-uuid',
      });

      expect(consentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-uuid',
          terms_version: 'v1.0-BR-pt-BR',
          accepted_ip: '127.0.0.1',
          accepted_user_agent: 'TestAgent',
          accepted_by_user_id: 'user-uuid',
        }),
      );
      expect(tenantRepo.update).toHaveBeenCalledWith(
        { id: 'tenant-uuid' },
        expect.objectContaining({
          stripe_terms_accepted_version: 'v1.0-BR-pt-BR',
          stripe_terms_accepted_ip: '127.0.0.1',
        }),
      );
      expect(result).toEqual(mockConsent);
    });
  });

  describe('hasValidConsent', () => {
    it('returns false when tenant has no accepted version', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant({ stripe_terms_accepted_version: null }));

      const result = await service.hasValidConsent('tenant-uuid');

      expect(result).toBe(false);
    });

    it('returns true when tenant version matches current terms', async () => {
      tenantRepo.findOne.mockResolvedValue(
        makeTenant({
          stripe_terms_accepted_version: 'v1.0-BR-pt-BR',
          stripe_connect_country: 'BR',
        }),
      );
      termsRepo.findOne.mockResolvedValue(makeTerms({ version: 'v1.0-BR-pt-BR' }));

      const result = await service.hasValidConsent('tenant-uuid');

      expect(result).toBe(true);
    });

    it('returns false when tenant version is outdated', async () => {
      tenantRepo.findOne.mockResolvedValue(
        makeTenant({
          stripe_terms_accepted_version: 'v0.9-BR-pt-BR',
          stripe_connect_country: 'BR',
        }),
      );
      termsRepo.findOne.mockResolvedValue(makeTerms({ version: 'v1.0-BR-pt-BR' }));

      const result = await service.hasValidConsent('tenant-uuid');

      expect(result).toBe(false);
    });
  });
});

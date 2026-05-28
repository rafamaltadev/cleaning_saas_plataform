import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Or, Repository } from 'typeorm';
import { StripeTermsVersion } from './stripe-terms-version.entity';
import { TenantStripeConsent } from './tenant-stripe-consent.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';

@Injectable()
export class StripeTermsService {
  private readonly logger = new Logger(StripeTermsService.name);

  constructor(
    @InjectRepository(StripeTermsVersion)
    private readonly termsRepo: Repository<StripeTermsVersion>,
    @InjectRepository(TenantStripeConsent)
    private readonly consentRepo: Repository<TenantStripeConsent>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async getCurrentTerms(params: {
    country: string;
    language: string;
  }): Promise<StripeTermsVersion | null> {
    const now = new Date();
    const terms = await this.termsRepo.findOne({
      where: [
        {
          country: params.country,
          language: params.language,
          effective_from: LessThanOrEqual(now),
          effective_until: IsNull(),
        },
        {
          country: params.country,
          language: params.language,
          effective_from: LessThanOrEqual(now),
          effective_until: Or(IsNull(), LessThanOrEqual(now)),
        },
      ],
      order: { effective_from: 'DESC' },
    });

    if (!terms) return null;
    // Only return if not expired
    if (terms.effective_until && terms.effective_until <= now) return null;
    return terms;
  }

  async recordConsent(params: {
    tenantId: string;
    termsVersion: string;
    ip: string;
    userAgent: string;
    userId: string;
  }): Promise<TenantStripeConsent> {
    const now = new Date();

    const consent = await this.consentRepo.save({
      tenant_id: params.tenantId,
      terms_version: params.termsVersion,
      accepted_at: now,
      accepted_ip: params.ip,
      accepted_user_agent: params.userAgent,
      accepted_by_user_id: params.userId,
    });

    await this.tenantRepo.update(
      { id: params.tenantId },
      {
        stripe_terms_accepted_version: params.termsVersion,
        stripe_terms_accepted_at: now,
        stripe_terms_accepted_ip: params.ip,
      },
    );

    this.logger.log(`Consent recorded for tenant ${params.tenantId}, version ${params.termsVersion}`);
    return consent;
  }

  async hasValidConsent(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant || !tenant.stripe_terms_accepted_version) return false;

    const country = tenant.stripe_connect_country ?? 'US';
    const language = country === 'BR' ? 'pt-BR' : 'en';

    const current = await this.getCurrentTerms({ country, language });
    if (!current) return false;

    return tenant.stripe_terms_accepted_version === current.version;
  }
}

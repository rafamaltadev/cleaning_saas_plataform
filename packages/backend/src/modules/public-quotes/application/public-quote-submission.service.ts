import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { Service } from '../../services/domain/service.entity';
import { Client } from '../../clients/domain/client.entity';
import { User } from '../../auth/domain/user.entity';
import { Quote } from '../../quotes/domain/quote.entity';
import { ServiceAddonRepository } from '../../services/infrastructure/service-addon.repository';
import { CreatePublicQuoteDto } from '../validation/create-public-quote.dto';

export interface QuotePublicCreatedEvent {
  quoteId: string;
  tenantId: string;
  clientId: string;
  estimatedTotalCents: number;
  origin: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class PublicQuoteSubmissionService {
  private readonly logger = new Logger(PublicQuoteSubmissionService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    private readonly serviceAddonRepository: ServiceAddonRepository,
  ) {}

  async createPublicQuote(
    tenantSlug: string,
    userId: string,
    dto: CreatePublicQuoteDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: string; estimated_total_cents: number }> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }

    // Cross-tenant injection check: service must belong to this tenant
    const service = await this.serviceRepo.findOne({
      where: { id: dto.service_id, deleted_at: IsNull() },
    });
    if (!service || service.tenant_id !== tenant.id) {
      throw new BadRequestException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found for this tenant' });
    }

    // Validate addon_ids cross-tenant
    const addonIds = dto.addon_ids ?? [];
    if (addonIds.length > 0) {
      const serviceAddons = await this.serviceAddonRepository.findByServiceId(service.id, tenant.id);
      const validAddonIds = new Set(serviceAddons.map((a) => a.id));
      for (const addonId of addonIds) {
        if (!validAddonIds.has(addonId)) {
          throw new BadRequestException({
            code: 'INVALID_ADDON',
            message: `Addon ${addonId} does not belong to this service or tenant`,
          });
        }
      }
    }

    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.roles.includes('client')) {
      throw new ForbiddenException({ code: 'NOT_CLIENT', message: 'Only client role can submit public quotes' });
    }

    // Resolve Client record (created during registration)
    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) {
      throw new NotFoundException({ code: 'CLIENT_NOT_FOUND', message: 'Client profile not found' });
    }

    const serviceAddress = `${dto.address}, ${dto.city} - ${dto.state}, ${dto.postal_code}`;
    const estimatedTotal = dto.estimated_total_cents ?? 0;
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quote = this.quoteRepo.create({
      tenant_id: tenant.id,
      client_id: client.id,
      service_id: service.id,
      pricing_rule_id: null,
      status: 'sent',
      origin: 'public',
      approval_required: true,
      created_by_client_id: client.id,
      estimated_total_cents: estimatedTotal,
      currency: tenant.currency,
      valid_until: validUntil,
      manual_discount_percent: 0,
      created_by: userId,
      service_address: serviceAddress,
      use_client_address: false,
      observations: dto.observations ?? null,
      area_sqm: dto.area_sqm ?? null,
      service_date: null,
    });

    const saved = await this.quoteRepo.save(quote);

    // Emit QuotePublicCreated domain event
    this.emitQuotePublicCreated({
      quoteId: saved.id,
      tenantId: tenant.id,
      clientId: client.id,
      estimatedTotalCents: estimatedTotal,
      origin: 'public',
      ip,
      userAgent,
    });

    return { id: saved.id, status: saved.status, estimated_total_cents: saved.estimated_total_cents };
  }

  emitQuotePublicCreated(event: QuotePublicCreatedEvent): void {
    this.logger.log(
      `QuotePublicCreated: quoteId=${event.quoteId} tenant=${event.tenantId} client=${event.clientId} origin=${event.origin} ip=${event.ip ?? 'unknown'} ua=${event.userAgent ?? 'unknown'}`,
    );
  }
}

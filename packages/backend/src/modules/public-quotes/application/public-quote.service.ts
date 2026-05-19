import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { Service } from '../../services/domain/service.entity';
import { ServiceAddonRepository } from '../../services/infrastructure/service-addon.repository';
import { PricingService } from '../../services/application/pricing.service';
import { QuoteEstimateDto } from '../validation/quote-estimate.dto';

export interface QuoteEstimateResult {
  subtotal_cents: number;
  addon_total_cents: number;
  discount_amount_cents: number;
  estimated_total_cents: number;
  currency: string;
}

export interface PublicAddonDto {
  id: string;
  name: string;
  price_cents: number;
}

@Injectable()
export class PublicQuoteService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly serviceAddonRepository: ServiceAddonRepository,
    private readonly pricingService: PricingService,
  ) {}

  async estimateQuote(tenantSlug: string, dto: QuoteEstimateDto): Promise<QuoteEstimateResult> {
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
      throw new BadRequestException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Service not found for this tenant',
      });
    }

    // Calculate subtotal before manual discount
    const subtotal_cents = this.pricingService.calculate({
      unit: service.unit,
      base_rate_cents: service.base_rate_cents,
      area_sqm: dto.area_sqm,
      duration_hours: dto.duration_hours,
      manual_discount_percent: 0,
    });

    const manualDiscount = dto.manual_discount_percent ?? 0;
    const discount_amount_cents = Math.round(subtotal_cents * (manualDiscount / 100));

    // Validate addon_ids belong to this service AND tenant, then sum totals
    let addon_total_cents = 0;
    const addonIds = dto.addon_ids ?? [];
    if (addonIds.length > 0) {
      const serviceAddons = await this.serviceAddonRepository.findByServiceId(service.id, tenant.id);
      const validAddonMap = new Map(serviceAddons.map((a) => [a.id, a]));

      for (const addonId of addonIds) {
        const addon = validAddonMap.get(addonId);
        if (!addon) {
          throw new BadRequestException({
            code: 'INVALID_ADDON',
            message: `Addon ${addonId} does not belong to this service or tenant`,
          });
        }
        addon_total_cents += addon.price_cents;
      }
    }

    const estimated_total_cents = subtotal_cents - discount_amount_cents + addon_total_cents;

    return {
      subtotal_cents,
      addon_total_cents,
      discount_amount_cents,
      estimated_total_cents,
      currency: tenant.currency,
    };
  }

  async getServiceAddons(tenantSlug: string, serviceId: string): Promise<PublicAddonDto[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }

    // Cross-tenant injection check: service must belong to this tenant
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, deleted_at: IsNull() },
    });
    if (!service || service.tenant_id !== tenant.id) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
    }

    const addons = await this.serviceAddonRepository.findByServiceId(service.id, tenant.id);
    return addons.map((a) => ({ id: a.id, name: a.name, price_cents: a.price_cents }));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { Service } from '../../services/domain/service.entity';
import { ServiceCategory } from '../../services/domain/service-category.entity';

export interface PublicProfileDto {
  tenant_slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  social_links: { instagram?: string; facebook?: string; whatsapp?: string; website?: string } | null;
  google_maps_embed_url: string | null;
  public_address: string | null;
}

export interface PublicServiceDto {
  id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  unit: string;
  currency: string;
  category_name: string | null;
}

@Injectable()
export class PublicTenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepo: Repository<ServiceCategory>,
  ) {}

  async getProfileBySlug(slug: string): Promise<PublicProfileDto | null> {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) return null;

    return {
      tenant_slug: tenant.tenant_slug,
      name: tenant.name,
      description: tenant.description ?? null,
      phone: tenant.phone ?? null,
      social_links: tenant.social_links ?? null,
      google_maps_embed_url: tenant.google_maps_embed_url ?? null,
      public_address: tenant.public_address ?? null,
    };
  }

  async getServicesBySlug(slug: string): Promise<PublicServiceDto[] | null> {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) return null;

    const services = await this.serviceRepo.find({
      where: { tenant_id: tenant.id, deleted_at: IsNull() },
    });

    const categoryIds = [...new Set(services.map((s) => s.category_id).filter(Boolean))] as string[];
    const categories = categoryIds.length
      ? await this.categoryRepo.findByIds(categoryIds)
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      base_rate_cents: s.base_rate_cents,
      unit: s.unit,
      currency: tenant.currency,
      category_name: s.category_id ? (categoryMap.get(s.category_id) ?? null) : null,
    }));
  }
}

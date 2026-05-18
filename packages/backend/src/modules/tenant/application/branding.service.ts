import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../infrastructure/tenant.repository';

export interface BrandingDto {
  tenant_slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  favicon_url: string | null;
}

interface CacheEntry {
  data: BrandingDto;
  expiresAt: number;
}

@Injectable()
export class BrandingService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly TTL_MS = 60_000;

  constructor(private readonly tenantRepository: TenantRepository) {}

  async getBrandingBySlug(slug: string): Promise<BrandingDto | null> {
    const cached = this.cache.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      return null;
    }

    const data: BrandingDto = {
      tenant_slug: tenant.tenant_slug,
      name: tenant.name,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      favicon_url: tenant.favicon_url,
    };

    this.cache.set(slug, { data, expiresAt: Date.now() + this.TTL_MS });
    return data;
  }
}

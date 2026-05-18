import { Tenant } from './tenant.entity';

export class TenantResponseDto {
  id: string;
  name: string;
  subscription_plan: string;
  currency: string;
  timezone: string;
  tenant_slug: string;
  logo_url: string | null;
  primary_color: string | null;
  favicon_url: string | null;
  description: string | null;
  phone: string | null;
  social_links: { instagram?: string; facebook?: string; whatsapp?: string; website?: string } | null;
  google_maps_embed_url: string | null;
  public_address: string | null;
  created_at: Date;
  updated_at: Date;

  static from(tenant: Tenant): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.subscription_plan = tenant.subscription_plan;
    dto.currency = tenant.currency;
    dto.timezone = tenant.timezone;
    dto.tenant_slug = tenant.tenant_slug;
    dto.logo_url = tenant.logo_url;
    dto.primary_color = tenant.primary_color;
    dto.favicon_url = tenant.favicon_url;
    dto.description = tenant.description ?? null;
    dto.phone = tenant.phone ?? null;
    dto.social_links = tenant.social_links ?? null;
    dto.google_maps_embed_url = tenant.google_maps_embed_url ?? null;
    dto.public_address = tenant.public_address ?? null;
    dto.created_at = tenant.created_at;
    dto.updated_at = tenant.updated_at;
    return dto;
  }
}

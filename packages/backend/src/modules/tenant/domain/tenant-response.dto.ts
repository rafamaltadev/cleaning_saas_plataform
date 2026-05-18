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
    dto.created_at = tenant.created_at;
    dto.updated_at = tenant.updated_at;
    return dto;
  }
}

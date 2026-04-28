import { Tenant } from './tenant.entity';

export class TenantResponseDto {
  id: string;
  name: string;
  subscription_plan: string;
  currency: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;

  static from(tenant: Tenant): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.subscription_plan = tenant.subscription_plan;
    dto.currency = tenant.currency;
    dto.timezone = tenant.timezone;
    dto.created_at = tenant.created_at;
    dto.updated_at = tenant.updated_at;
    return dto;
  }
}

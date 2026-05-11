import { ServiceAddon } from './service-addon.entity';

export class ServiceAddonResponseDto {
  id: string;
  tenant_id: string;
  service_id: string;
  name: string;
  price_cents: number;
  created_at: Date;
  updated_at: Date;

  static from(addon: ServiceAddon): ServiceAddonResponseDto {
    const dto = new ServiceAddonResponseDto();
    dto.id = addon.id;
    dto.tenant_id = addon.tenant_id;
    dto.service_id = addon.service_id;
    dto.name = addon.name;
    dto.price_cents = addon.price_cents;
    dto.created_at = addon.created_at;
    dto.updated_at = addon.updated_at;
    return dto;
  }
}

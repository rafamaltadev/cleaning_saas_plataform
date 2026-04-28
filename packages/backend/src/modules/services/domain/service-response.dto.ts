import { Service } from './service.entity';

export class ServiceResponseDto {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  unit: string;
  created_at: Date;
  updated_at: Date;

  static from(service: Service): ServiceResponseDto {
    const dto = new ServiceResponseDto();
    dto.id = service.id;
    dto.tenant_id = service.tenant_id;
    dto.name = service.name;
    dto.description = service.description;
    dto.base_rate_cents = service.base_rate_cents;
    dto.unit = service.unit;
    dto.created_at = service.created_at;
    dto.updated_at = service.updated_at;
    return dto;
  }
}

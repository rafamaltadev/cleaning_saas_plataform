import { Service } from './service.entity';

interface ServiceContext {
  categoryName?: string;
}

export class ServiceResponseDto {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  unit: string;
  category_id: string | null;
  category_name?: string;
  estimated_duration_minutes: number | null;
  billing_type: string;
  availability: object | null;
  materials_included: boolean;
  materials_cost_cents: number | null;
  observations: string | null;
  has_addons: boolean;
  created_at: Date;
  updated_at: Date;

  static from(service: Service, context?: ServiceContext): ServiceResponseDto {
    const dto = new ServiceResponseDto();
    dto.id = service.id;
    dto.tenant_id = service.tenant_id;
    dto.name = service.name;
    dto.description = service.description;
    dto.base_rate_cents = service.base_rate_cents;
    dto.unit = service.unit;
    dto.category_id = service.category_id ?? null;
    dto.estimated_duration_minutes = service.estimated_duration_minutes ?? null;
    dto.billing_type = service.billing_type ?? 'fixed';
    dto.availability = service.availability ?? null;
    dto.materials_included = service.materials_included ?? false;
    dto.materials_cost_cents = service.materials_cost_cents ?? null;
    dto.observations = service.observations ?? null;
    dto.has_addons = service.has_addons ?? false;
    dto.created_at = service.created_at;
    dto.updated_at = service.updated_at;
    if (context?.categoryName) dto.category_name = context.categoryName;
    return dto;
  }
}

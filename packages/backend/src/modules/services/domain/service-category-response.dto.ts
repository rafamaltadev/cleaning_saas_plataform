import { ServiceCategory } from './service-category.entity';

export class ServiceCategoryResponseDto {
  id: string;
  tenant_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;

  static from(category: ServiceCategory): ServiceCategoryResponseDto {
    const dto = new ServiceCategoryResponseDto();
    dto.id = category.id;
    dto.tenant_id = category.tenant_id;
    dto.name = category.name;
    dto.created_at = category.created_at;
    dto.updated_at = category.updated_at;
    return dto;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceRepository } from '../infrastructure/service.repository';
import { ServiceCategoryRepository } from '../infrastructure/service-category.repository';
import { ServiceResponseDto } from '../domain/service-response.dto';
import { CreateServiceDto } from '../domain/create-service.dto';
import { UpdateServiceDto } from '../domain/update-service.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly categoryRepository: ServiceCategoryRepository,
  ) {}

  private async resolveServiceContext(
    categoryId: string | null | undefined,
    tenantId: string,
  ): Promise<{ categoryName?: string }> {
    if (!categoryId) return {};
    const category = await this.categoryRepository.findById(categoryId, tenantId).catch(() => null);
    return { categoryName: category?.name };
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<ServiceResponseDto>> {
    const result = await this.serviceRepository.findPaginated(tenantId, query);
    const items = await Promise.all(
      result.items.map(async (service) => {
        const context = await this.resolveServiceContext(service.category_id, tenantId);
        return ServiceResponseDto.from(service, context);
      }),
    );
    return { items, meta: result.meta };
  }

  async create(tenantId: string, dto: CreateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.save({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      base_rate_cents: dto.base_rate_cents,
      unit: dto.unit,
      category_id: dto.category_id ?? null,
      estimated_duration_minutes: dto.estimated_duration_minutes ?? null,
      billing_type: dto.billing_type ?? 'fixed',
      availability: dto.availability ?? null,
      materials_included: dto.materials_included ?? false,
      materials_cost_cents: dto.materials_cost_cents ?? null,
      observations: dto.observations ?? null,
      has_addons: dto.has_addons ?? false,
      deleted_at: null,
    });
    const context = await this.resolveServiceContext(service.category_id, tenantId);
    return ServiceResponseDto.from(service, context);
  }

  async findOne(tenantId: string, serviceId: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findById(serviceId, tenantId);
    if (!service) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
    }
    const context = await this.resolveServiceContext(service.category_id, tenantId);
    return ServiceResponseDto.from(service, context);
  }

  async update(
    tenantId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const existing = await this.serviceRepository.findById(serviceId, tenantId);
    if (!existing) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
    }
    Object.assign(existing, dto);
    const saved = await this.serviceRepository.save(existing);
    const context = await this.resolveServiceContext(saved.category_id, tenantId);
    return ServiceResponseDto.from(saved, context);
  }

  async remove(tenantId: string, serviceId: string): Promise<void> {
    const existing = await this.serviceRepository.findById(serviceId, tenantId);
    if (!existing) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
    }
    await this.serviceRepository.softDelete(serviceId);
  }
}

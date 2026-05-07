import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceRepository } from '../infrastructure/service.repository';
import { ServiceResponseDto } from '../domain/service-response.dto';
import { CreateServiceDto } from '../domain/create-service.dto';
import { UpdateServiceDto } from '../domain/update-service.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<ServiceResponseDto>> {
    const result = await this.serviceRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(ServiceResponseDto.from),
      meta: result.meta,
    };
  }

  async create(tenantId: string, dto: CreateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.save({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      base_rate_cents: dto.base_rate_cents,
      unit: dto.unit,
      deleted_at: null,
    });
    return ServiceResponseDto.from(service);
  }

  async findOne(tenantId: string, serviceId: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findById(serviceId, tenantId);
    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Service not found',
      });
    }
    return ServiceResponseDto.from(service);
  }

  async update(
    tenantId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const existing = await this.serviceRepository.findById(serviceId, tenantId);
    if (!existing) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Service not found',
      });
    }
    Object.assign(existing, dto);
    const saved = await this.serviceRepository.save(existing);
    return ServiceResponseDto.from(saved);
  }

  async remove(tenantId: string, serviceId: string): Promise<void> {
    const existing = await this.serviceRepository.findById(serviceId, tenantId);
    if (!existing) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Service not found',
      });
    }
    await this.serviceRepository.softDelete(serviceId);
  }
}

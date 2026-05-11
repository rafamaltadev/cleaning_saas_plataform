import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceAddonRepository } from '../infrastructure/service-addon.repository';
import { ServiceAddonResponseDto } from '../domain/service-addon-response.dto';
import { CreateServiceAddonDto } from '../domain/create-service-addon.dto';
import { UpdateServiceAddonDto } from '../domain/update-service-addon.dto';

@Injectable()
export class ServiceAddonsService {
  constructor(private readonly addonRepository: ServiceAddonRepository) {}

  async findByServiceId(serviceId: string, tenantId: string): Promise<ServiceAddonResponseDto[]> {
    const addons = await this.addonRepository.findByServiceId(serviceId, tenantId);
    return addons.map(ServiceAddonResponseDto.from);
  }

  async create(
    serviceId: string,
    tenantId: string,
    dto: CreateServiceAddonDto,
  ): Promise<ServiceAddonResponseDto> {
    const addon = await this.addonRepository.save({
      tenant_id: tenantId,
      service_id: serviceId,
      name: dto.name,
      price_cents: dto.price_cents,
      deleted_at: null,
    });
    return ServiceAddonResponseDto.from(addon);
  }

  async update(
    serviceId: string,
    tenantId: string,
    addonId: string,
    dto: UpdateServiceAddonDto,
  ): Promise<ServiceAddonResponseDto> {
    const existing = await this.addonRepository.findById(addonId, tenantId);
    if (!existing || existing.service_id !== serviceId) {
      throw new NotFoundException({ code: 'ADDON_NOT_FOUND', message: 'Addon not found' });
    }
    Object.assign(existing, dto);
    const saved = await this.addonRepository.save(existing);
    return ServiceAddonResponseDto.from(saved);
  }

  async remove(serviceId: string, tenantId: string, addonId: string): Promise<void> {
    const existing = await this.addonRepository.findById(addonId, tenantId);
    if (!existing || existing.service_id !== serviceId) {
      throw new NotFoundException({ code: 'ADDON_NOT_FOUND', message: 'Addon not found' });
    }
    await this.addonRepository.softDelete(addonId);
  }
}

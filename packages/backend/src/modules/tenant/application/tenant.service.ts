import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { TenantResponseDto } from '../domain/tenant-response.dto';
import { UpdateTenantDto } from '../domain/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async getById(tenantId: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }
    return TenantResponseDto.from(tenant);
  }

  async update(tenantId: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    Object.assign(tenant, dto);
    const saved = await this.tenantRepository.save(tenant);
    return TenantResponseDto.from(saved);
  }
}

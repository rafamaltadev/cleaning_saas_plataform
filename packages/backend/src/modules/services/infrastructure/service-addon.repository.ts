import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceAddon } from '../domain/service-addon.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class ServiceAddonRepository extends TenantScopedRepository<ServiceAddon> {
  constructor(
    @InjectRepository(ServiceAddon)
    repo: Repository<ServiceAddon>,
  ) {
    super(repo);
  }

  async findByServiceId(serviceId: string, tenantId: string): Promise<ServiceAddon[]> {
    return this.buildBaseQuery('entity')
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .andWhere('entity.service_id = :serviceId', { serviceId })
      .getMany();
  }
}

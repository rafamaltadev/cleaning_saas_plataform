import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from '../domain/pricing-rule.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class PricingRuleRepository extends TenantScopedRepository<PricingRule> {
  constructor(
    @InjectRepository(PricingRule)
    repo: Repository<PricingRule>,
  ) {
    super(repo);
  }

  async findByServiceId(serviceId: string, tenantId: string): Promise<PricingRule | null> {
    return this.buildBaseQuery('entity')
      .andWhere('entity.service_id = :serviceId', { serviceId })
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .getOne();
  }
}

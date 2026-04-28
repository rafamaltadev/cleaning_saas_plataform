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
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteAddon } from '../domain/quote-addon.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class QuoteAddonRepository extends TenantScopedRepository<QuoteAddon> {
  constructor(
    @InjectRepository(QuoteAddon)
    repo: Repository<QuoteAddon>,
  ) {
    super(repo);
  }

  async findByQuoteId(quoteId: string, tenantId: string): Promise<QuoteAddon[]> {
    return this.buildBaseQuery('entity')
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .andWhere('entity.quote_id = :quoteId', { quoteId })
      .getMany();
  }
}

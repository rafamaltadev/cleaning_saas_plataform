import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../domain/quote.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';
import { ListQuotesQueryDto } from '../validation/list-quotes-query.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class QuoteRepository extends TenantScopedRepository<Quote> {
  constructor(
    @InjectRepository(Quote)
    repo: Repository<Quote>,
  ) {
    super(repo);
  }

  async findPaginated(
    tenantId: string,
    query: ListQuotesQueryDto,
  ): Promise<PaginatedResult<Quote>> {
    const { page, limit, sort, order, status } = query;

    const qb = this.buildBaseQuery('entity').andWhere(
      'entity.tenant_id = :tenantId',
      { tenantId },
    );

    if (status) {
      qb.andWhere('entity.status = :status', { status });
    }

    if (sort) {
      qb.orderBy(`entity.${sort}`, (order?.toUpperCase() ?? 'ASC') as 'ASC' | 'DESC');
    } else {
      qb.orderBy('entity.created_at', 'DESC');
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

import { SoftDeleteRepository } from './soft-delete.repository';
import { PaginatedResult, PaginationQueryDto } from '../dto/pagination.dto';

export abstract class TenantScopedRepository<
  T extends { deleted_at?: Date | null; id: string; tenant_id: string },
> extends SoftDeleteRepository<T> {
  async findPaginated(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort, order } = query;

    const qb = this.buildBaseQuery('entity').andWhere(
      'entity.tenant_id = :tenantId',
      { tenantId },
    );

    if (sort) {
      qb.orderBy(`entity.${sort}`, (order?.toUpperCase() ?? 'ASC') as 'ASC' | 'DESC');
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

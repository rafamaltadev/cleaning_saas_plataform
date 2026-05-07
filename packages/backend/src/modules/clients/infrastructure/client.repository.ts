import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../domain/client.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';
import { ListClientsQueryDto } from '../domain/list-clients-query.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class ClientRepository extends TenantScopedRepository<Client> {
  constructor(
    @InjectRepository(Client)
    repo: Repository<Client>,
  ) {
    super(repo);
  }

  async findPaginated(
    tenantId: string,
    query: ListClientsQueryDto,
  ): Promise<PaginatedResult<Client>> {
    const { page, limit, sort, order, search } = query;

    const qb = this.buildBaseQuery('entity').andWhere(
      'entity.tenant_id = :tenantId',
      { tenantId },
    );

    if (search) {
      qb.andWhere('entity.name ILIKE :search', { search: `%${search}%` });
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

  async findByIdUnscoped(id: string): Promise<Client | null> {
    return this.repository
      .createQueryBuilder('entity')
      .where('entity.id = :id', { id })
      .andWhere('entity.deleted_at IS NULL')
      .getOne();
  }
}

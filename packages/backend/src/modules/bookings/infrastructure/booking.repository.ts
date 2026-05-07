import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../domain/booking.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';
import { ListBookingsQueryDto } from '../validation/list-bookings-query.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class BookingRepository extends TenantScopedRepository<Booking> {
  constructor(
    @InjectRepository(Booking)
    repo: Repository<Booking>,
  ) {
    super(repo);
  }

  async findPaginated(
    tenantId: string,
    query: ListBookingsQueryDto,
  ): Promise<PaginatedResult<Booking>> {
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

  async findByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string,
  ): Promise<Booking | null> {
    return this.buildBaseQuery('entity')
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .andWhere('entity.idempotency_key = :idempotencyKey', { idempotencyKey })
      .getOne();
  }
}
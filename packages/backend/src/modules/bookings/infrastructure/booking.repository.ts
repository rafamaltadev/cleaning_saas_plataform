import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../domain/booking.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class BookingRepository extends TenantScopedRepository<Booking> {
  constructor(
    @InjectRepository(Booking)
    repo: Repository<Booking>,
  ) {
    super(repo);
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
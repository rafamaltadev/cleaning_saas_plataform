import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../domain/payment.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class PaymentRepository extends TenantScopedRepository<Payment> {
  constructor(
    @InjectRepository(Payment)
    repo: Repository<Payment>,
  ) {
    super(repo);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string,
  ): Promise<Payment | null> {
    return this.buildBaseQuery('entity')
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .andWhere('entity.idempotency_key = :idempotencyKey', { idempotencyKey })
      .getOne();
  }
}

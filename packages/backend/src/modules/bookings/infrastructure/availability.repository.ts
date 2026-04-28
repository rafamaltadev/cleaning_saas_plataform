import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../domain/availability.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class AvailabilityRepository extends TenantScopedRepository<Availability> {
  constructor(
    @InjectRepository(Availability)
    repo: Repository<Availability>,
  ) {
    super(repo);
  }

  async findConflicts(
    tenantId: string,
    employeeId: string,
    availableDate: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<Availability[]> {
    const qb = this.buildBaseQuery('a')
      .andWhere('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.employee_id = :employeeId', { employeeId })
      .andWhere('a.available_date = :availableDate', { availableDate })
      .andWhere('a.start_time < :endTime', { endTime })
      .andWhere('a.end_time > :startTime', { startTime });

    if (excludeId) {
      qb.andWhere('a.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }
}
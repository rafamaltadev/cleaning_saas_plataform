import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from '../domain/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id, deleted_at: IsNull() } });
  }

  async save(tenant: Partial<Tenant>): Promise<Tenant> {
    return this.repo.save(tenant as Tenant);
  }
}

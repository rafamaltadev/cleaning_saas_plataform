import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../domain/service-category.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class ServiceCategoryRepository extends TenantScopedRepository<ServiceCategory> {
  constructor(
    @InjectRepository(ServiceCategory)
    repo: Repository<ServiceCategory>,
  ) {
    super(repo);
  }
}

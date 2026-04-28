import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from '../domain/assignment.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class AssignmentRepository extends TenantScopedRepository<Assignment> {
  constructor(
    @InjectRepository(Assignment)
    repo: Repository<Assignment>,
  ) {
    super(repo);
  }
}
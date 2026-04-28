import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/domain/user.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class UserRepository extends TenantScopedRepository<User> {
  constructor(
    @InjectRepository(User)
    repo: Repository<User>,
  ) {
    super(repo);
  }
}

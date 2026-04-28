import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../domain/client.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class ClientRepository extends TenantScopedRepository<Client> {
  constructor(
    @InjectRepository(Client)
    repo: Repository<Client>,
  ) {
    super(repo);
  }

  async findByIdUnscoped(id: string): Promise<Client | null> {
    return this.repository
      .createQueryBuilder('entity')
      .where('entity.id = :id', { id })
      .andWhere('entity.deleted_at IS NULL')
      .getOne();
  }
}

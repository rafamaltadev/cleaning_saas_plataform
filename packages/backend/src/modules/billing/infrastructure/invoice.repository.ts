import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../domain/invoice.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class InvoiceRepository extends TenantScopedRepository<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    repo: Repository<Invoice>,
  ) {
    super(repo);
  }
}

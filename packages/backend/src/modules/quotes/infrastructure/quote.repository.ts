import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../domain/quote.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class QuoteRepository extends TenantScopedRepository<Quote> {
  constructor(
    @InjectRepository(Quote)
    repo: Repository<Quote>,
  ) {
    super(repo);
  }
}

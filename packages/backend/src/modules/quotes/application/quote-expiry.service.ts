import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Quote } from '../domain/quote.entity';

@Injectable()
export class QuoteExpiryService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 0 * * *')
  async expireOverdueQuotes(): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(Quote)
      .set({ status: 'expired' } as Partial<Quote>)
      .where('status = :status', { status: 'sent' })
      .andWhere('valid_until < :now', { now: new Date() })
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}

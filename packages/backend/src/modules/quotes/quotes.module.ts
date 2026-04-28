import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './domain/quote.entity';
import { QuoteRepository } from './infrastructure/quote.repository';
import { QuoteService } from './application/quote.service';
import { QuotesController } from './interfaces/quotes.controller';
import { ServicesModule } from '../services/services.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote]),
    ServicesModule,
    AuditLogModule,
    AuthModule,
  ],
  providers: [QuoteRepository, QuoteService],
  controllers: [QuotesController],
  exports: [QuoteService, QuoteRepository],
})
export class QuotesModule {}

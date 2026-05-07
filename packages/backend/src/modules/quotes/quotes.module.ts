import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './domain/quote.entity';
import { QuoteRepository } from './infrastructure/quote.repository';
import { QuoteService } from './application/quote.service';
import { QuoteExpiryService } from './application/quote-expiry.service';
import { QuotesController } from './interfaces/quotes.controller';
import { ServicesModule } from '../services/services.module';
import { ClientsModule } from '../clients/clients.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote]),
    ServicesModule,
    ClientsModule,
    AuthModule,
  ],
  providers: [QuoteRepository, QuoteService, QuoteExpiryService],
  controllers: [QuotesController],
  exports: [QuoteService, QuoteRepository],
})
export class QuotesModule {}

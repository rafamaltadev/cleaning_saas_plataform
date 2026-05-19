import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/domain/tenant.entity';
import { Service } from '../services/domain/service.entity';
import { Client } from '../clients/domain/client.entity';
import { User } from '../auth/domain/user.entity';
import { Quote } from '../quotes/domain/quote.entity';
import { ServicesModule } from '../services/services.module';
import { AuthModule } from '../auth/auth.module';
import { PublicQuoteService } from './application/public-quote.service';
import { PublicQuoteSubmissionService } from './application/public-quote-submission.service';
import { PublicQuoteController } from './interfaces/public-quote.controller';
import { PublicQuoteSubmissionController } from './interfaces/public-quote-submission.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Service, Client, User, Quote]),
    ServicesModule,
    AuthModule,
  ],
  providers: [PublicQuoteService, PublicQuoteSubmissionService],
  controllers: [PublicQuoteController, PublicQuoteSubmissionController],
})
export class PublicQuotesModule {}

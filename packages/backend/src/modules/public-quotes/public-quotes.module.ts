import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/domain/tenant.entity';
import { Service } from '../services/domain/service.entity';
import { ServicesModule } from '../services/services.module';
import { PublicQuoteService } from './application/public-quote.service';
import { PublicQuoteController } from './interfaces/public-quote.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Service]),
    ServicesModule,
  ],
  providers: [PublicQuoteService],
  controllers: [PublicQuoteController],
})
export class PublicQuotesModule {}

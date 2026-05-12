import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './domain/quote.entity';
import { QuoteAddon } from './domain/quote-addon.entity';
import { QuoteRepository } from './infrastructure/quote.repository';
import { QuoteAddonRepository } from './infrastructure/quote-addon.repository';
import { QuoteService } from './application/quote.service';
import { QuoteAddonsService } from './application/quote-addons.service';
import { QuoteExpiryService } from './application/quote-expiry.service';
import { QuoteAddonsController } from './interfaces/quote-addons.controller';
import { QuotesController } from './interfaces/quotes.controller';
import { ServicesModule } from '../services/services.module';
import { ClientsModule } from '../clients/clients.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteAddon]),
    ServicesModule,
    ClientsModule,
    AuthModule,
  ],
  providers: [QuoteRepository, QuoteAddonRepository, QuoteService, QuoteAddonsService, QuoteExpiryService],
  controllers: [QuoteAddonsController, QuotesController],
  exports: [QuoteService, QuoteRepository],
})
export class QuotesModule {}

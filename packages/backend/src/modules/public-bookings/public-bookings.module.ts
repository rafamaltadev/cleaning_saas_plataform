import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/domain/tenant.entity';
import { User } from '../auth/domain/user.entity';
import { Client } from '../clients/domain/client.entity';
import { Quote } from '../quotes/domain/quote.entity';
import { Booking } from '../bookings/domain/booking.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AvailabilityService } from './application/availability.service';
import { PublicBookingService } from './application/public-booking.service';
import { PublicBookingController } from './interfaces/public-booking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Client, Quote, Booking]),
    AuthModule,
    AuditLogModule,
  ],
  providers: [AvailabilityService, PublicBookingService],
  controllers: [PublicBookingController],
  exports: [PublicBookingService],
})
export class PublicBookingsModule {}

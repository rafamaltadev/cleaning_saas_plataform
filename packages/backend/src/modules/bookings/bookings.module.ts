import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './domain/booking.entity';
import { Availability } from './domain/availability.entity';
import { Assignment } from './domain/assignment.entity';
import { BookingRepository } from './infrastructure/booking.repository';
import { AvailabilityRepository } from './infrastructure/availability.repository';
import { AssignmentRepository } from './infrastructure/assignment.repository';
import { BookingService } from './application/booking.service';
import { SchedulingService } from './application/scheduling.service';
import { AssignmentService } from './application/assignment.service';
import { BookingsController } from './interfaces/bookings.controller';
import { AvailabilityController } from './interfaces/availability.controller';
import { AssignmentsController } from './interfaces/assignments.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Availability, Assignment]),
    AuditLogModule,
    AuthModule,
  ],
  providers: [
    BookingRepository,
    AvailabilityRepository,
    AssignmentRepository,
    BookingService,
    SchedulingService,
    AssignmentService,
  ],
  controllers: [BookingsController, AvailabilityController, AssignmentsController],
  exports: [BookingService, BookingRepository],
})
export class BookingsModule {}
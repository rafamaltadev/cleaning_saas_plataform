import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { BookingRepository } from '../infrastructure/booking.repository';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Booking, BookingStatus } from '../domain/booking.entity';
import { BookingResponseDto } from '../domain/booking-response.dto';
import { CreateBookingDto } from '../validation/create-booking.dto';
import { UpdateBookingDto } from '../validation/update-booking.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ListBookingsQueryDto } from '../validation/list-bookings-query.dto';
import { Quote } from '../../quotes/domain/quote.entity';

const TERMINAL_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly domainEventBus: DomainEventBus,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const existing = await this.bookingRepository.findByIdempotencyKey(
      dto.idempotency_key,
      tenantId,
    );
    if (existing) {
      return BookingResponseDto.from(existing);
    }

    let booking: Booking | undefined;
    let wasTransitioned = false;

    await this.dataSource.transaction(async (manager) => {
      const existingInTx = await manager.findOne(Booking, {
        where: {
          idempotency_key: dto.idempotency_key,
          tenant_id: tenantId,
          deleted_at: IsNull(),
        },
      });
      if (existingInTx) {
        booking = existingInTx;
        return;
      }

      const quote = await manager.findOne(Quote, {
        where: { id: dto.quote_id, tenant_id: tenantId, deleted_at: IsNull() },
      });
      if (!quote) {
        throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
      }
      if (!['sent', 'accepted'].includes(quote.status)) {
        throw new BadRequestException({
          code: 'INVALID_QUOTE_STATUS',
          message: `Quote must be in 'sent' or 'accepted' status to create a booking`,
        });
      }

      wasTransitioned = quote.status === 'sent';
      if (wasTransitioned) {
        quote.status = 'accepted';
        await manager.save(Quote, quote);
      }

      const newBooking = new Booking();
      newBooking.tenant_id = tenantId;
      newBooking.quote_id = dto.quote_id;
      newBooking.client_id = dto.client_id ?? quote.client_id;
      newBooking.service_id = dto.service_id ?? quote.service_id;
      newBooking.scheduled_start = new Date(dto.scheduled_start);
      newBooking.scheduled_end = new Date(dto.scheduled_end);
      newBooking.status = 'confirmed';
      newBooking.assigned_team = dto.assigned_team ?? null;
      newBooking.idempotency_key = dto.idempotency_key;
      newBooking.deleted_at = null;
      booking = await manager.save(Booking, newBooking);
    });

    this.domainEventBus.emit('booking.confirmed', {
      bookingId: booking!.id,
      tenantId,
      userId: actorId,
      oldValues: { quote_status: 'sent' },
      newValues: { status: 'confirmed', quote_status: 'accepted' },
    });
    if (wasTransitioned) {
      this.domainEventBus.emit('quote.accepted', {
        quoteId: dto.quote_id,
        tenantId,
        userId: actorId,
        oldValues: { status: 'sent' },
        newValues: { status: 'accepted' },
      });
    }

    return BookingResponseDto.from(booking!);
  }

  async findAll(
    tenantId: string,
    query: ListBookingsQueryDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    const result = await this.bookingRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(BookingResponseDto.from),
      meta: result.meta,
    };
  }

  async findById(id: string, tenantId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id, tenantId);
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    return BookingResponseDto.from(booking);
  }

  async update(
    id: string,
    tenantId: string,
    actorId: string,
    dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    void actorId;
    const booking = await this.bookingRepository.findById(id, tenantId);
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: `Cannot update a booking with status '${booking.status}'`,
      });
    }

    if (dto.scheduled_start) booking.scheduled_start = new Date(dto.scheduled_start);
    if (dto.scheduled_end) booking.scheduled_end = new Date(dto.scheduled_end);
    if (dto.assigned_team !== undefined) booking.assigned_team = dto.assigned_team;
    if (dto.status) booking.status = dto.status as BookingStatus;

    const saved = await this.bookingRepository.save(booking);

    return BookingResponseDto.from(saved);
  }

  async complete(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id, tenantId);
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: `Cannot complete a booking with status '${booking.status}'`,
      });
    }

    const oldStatus = booking.status;
    booking.status = 'completed';
    const saved = await this.bookingRepository.save(booking);

    this.domainEventBus.emit('booking.completed', {
      bookingId: id,
      tenantId,
      userId: actorId,
      oldValues: { status: oldStatus },
      newValues: { status: 'completed' },
    });

    return BookingResponseDto.from(saved);
  }
}

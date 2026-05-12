import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { BookingRepository } from '../infrastructure/booking.repository';
import { ClientRepository } from '../../clients/infrastructure/client.repository';
import { ServiceRepository } from '../../services/infrastructure/service.repository';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Booking, BookingStatus } from '../domain/booking.entity';
import { BookingResponseDto } from '../domain/booking-response.dto';
import { CreateBookingDto } from '../validation/create-booking.dto';
import { UpdateBookingDto } from '../validation/update-booking.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ListBookingsQueryDto } from '../validation/list-bookings-query.dto';
import { Quote } from '../../quotes/domain/quote.entity';

const TERMINAL_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ['completed', 'cancelled', 'rescheduled'],
  rescheduled: ['completed', 'cancelled', 'confirmed'],
  cancelled: ['confirmed'],
  completed: ['confirmed'],
};

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly clientRepository: ClientRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly domainEventBus: DomainEventBus,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async resolveBookingContext(
    clientId: string,
    serviceId: string,
    quoteId: string,
    tenantId: string,
  ): Promise<{ clientName?: string; serviceName?: string; quoteTotalCents?: number }> {
    const [client, service] = await Promise.all([
      this.clientRepository.findById(clientId, tenantId).catch(() => null),
      this.serviceRepository.findById(serviceId, tenantId).catch(() => null),
    ]);
    const [quoteRow] = await this.dataSource
      .query(
        `SELECT estimated_total_cents FROM quotes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [quoteId, tenantId],
      )
      .catch(() => [null]);
    const quoteTotalCents: number | undefined =
      quoteRow?.estimated_total_cents !== undefined
        ? Number(quoteRow.estimated_total_cents)
        : undefined;
    return { clientName: client?.name, serviceName: service?.name, quoteTotalCents };
  }

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
      newBooking.service_address = dto.service_address ?? null;
      newBooking.use_client_address = dto.use_client_address ?? true;
      newBooking.observations = dto.observations ?? null;
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
    const items = await Promise.all(
      result.items.map(async (booking) => {
        const context = await this.resolveBookingContext(
          booking.client_id, booking.service_id, booking.quote_id, tenantId,
        );
        return BookingResponseDto.from(booking, context);
      }),
    );
    return { items, meta: result.meta };
  }

  async findById(id: string, tenantId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id, tenantId);
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    const context = await this.resolveBookingContext(
      booking.client_id, booking.service_id, booking.quote_id, tenantId,
    );
    return BookingResponseDto.from(booking, context);
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
      const newStatus = dto.status as BookingStatus | undefined;
      const validTargets = VALID_TRANSITIONS[booking.status] ?? [];
      if (!newStatus || !validTargets.includes(newStatus)) {
        throw new BadRequestException({
          code: 'INVALID_BOOKING_STATUS',
          message: `Cannot update a booking with status '${booking.status}'`,
        });
      }
      if (newStatus === 'confirmed') {
        if (!dto.scheduled_start || new Date(dto.scheduled_start) <= new Date()) {
          throw new BadRequestException(
            'Para reativar este agendamento, informe uma data futura.',
          );
        }
      }
    }

    if (dto.quote_id) booking.quote_id = dto.quote_id;
    if (dto.scheduled_start) booking.scheduled_start = new Date(dto.scheduled_start);
    if (dto.scheduled_end) booking.scheduled_end = new Date(dto.scheduled_end);
    if (dto.assigned_team !== undefined) booking.assigned_team = dto.assigned_team;
    if (dto.status) booking.status = dto.status as BookingStatus;
    if (dto.service_address !== undefined) booking.service_address = dto.service_address ?? null;
    if (dto.use_client_address !== undefined) booking.use_client_address = dto.use_client_address;
    if (dto.observations !== undefined) booking.observations = dto.observations ?? null;

    const saved = await this.bookingRepository.save(booking);

    const context = await this.resolveBookingContext(
      saved.client_id, saved.service_id, saved.quote_id, tenantId,
    );
    return BookingResponseDto.from(saved, context);
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

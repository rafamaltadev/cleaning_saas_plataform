import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { User } from '../../auth/domain/user.entity';
import { Client } from '../../clients/domain/client.entity';
import { Quote } from '../../quotes/domain/quote.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { BUSY_STATUSES } from '../../bookings/application/booking.service';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { CreatePublicBookingDto } from '../validation/create-public-booking.dto';

@Injectable()
export class PublicBookingService {
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createPublicBooking(
    tenantSlug: string,
    userId: string,
    dto: CreatePublicBookingDto,
  ): Promise<Booking> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }

    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    if (!user.roles.includes('client')) {
      throw new ForbiddenException({ code: 'NOT_CLIENT', message: 'Only clients can create public bookings' });
    }

    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) {
      throw new NotFoundException({ code: 'CLIENT_NOT_FOUND', message: 'Client profile not found' });
    }

    // Cross-tenant injection check: quote must belong to this tenant and this client
    const quote = await this.quoteRepo.findOne({
      where: { id: dto.quote_id, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!quote) {
      throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
    }
    if (quote.client_id !== client.id) {
      throw new ForbiddenException({
        code: 'QUOTE_ACCESS_DENIED',
        message: 'This quote does not belong to the authenticated client',
      });
    }
    if (!['sent', 'accepted'].includes(quote.status)) {
      throw new BadRequestException({
        code: 'INVALID_QUOTE_STATUS',
        message: `Quote must be in 'sent' or 'accepted' status to create a booking`,
      });
    }

    const scheduledStart = new Date(dto.scheduled_start);
    const scheduledEnd = new Date(dto.scheduled_end);
    const idempotencyKey = `public-${client.id}-${scheduledStart.getTime()}`;

    let savedBooking!: Booking;

    await this.dataSource.transaction(async (manager) => {
      // Idempotency check inside transaction
      const existing = await manager.findOne(Booking, {
        where: {
          idempotency_key: idempotencyKey,
          tenant_id: tenant.id,
          deleted_at: IsNull(),
        },
      });
      if (existing) {
        savedBooking = existing;
        return;
      }

      // Atomic slot conflict check with row-level lock
      const conflicting = await manager.query(
        `SELECT id FROM bookings
          WHERE tenant_id = $1
            AND deleted_at IS NULL
            AND status = ANY($2)
            AND scheduled_start < $4
            AND scheduled_end > $3
          FOR UPDATE`,
        [tenant.id, BUSY_STATUSES, scheduledStart, scheduledEnd],
      ) as { id: string }[];

      if (conflicting.length > 0) {
        throw new BadRequestException({
          code: 'SLOT_UNAVAILABLE',
          message: 'The requested time slot is already taken',
        });
      }

      const booking = manager.create(Booking, {
        tenant_id: tenant.id,
        quote_id: quote.id,
        client_id: client.id,
        service_id: quote.service_id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        status: 'pending_approval',
        origin: 'public',
        approval_required: true,
        assigned_team: null,
        idempotency_key: idempotencyKey,
        service_address: dto.service_address ?? null,
        use_client_address: dto.service_address == null,
        observations: dto.observations ?? null,
        deleted_at: null,
      });

      savedBooking = await manager.save(Booking, booking);
    });

    // Audit log
    void this.auditLogService.emit({
      tenant_id: tenant.id,
      user_id: userId,
      action: 'public_booking_created',
      resource_type: 'booking',
      resource_id: savedBooking.id,
      new_values: { status: 'pending_approval', origin: 'public', quote_id: dto.quote_id },
    }).catch((err) => this.logger.error('Failed audit log for public booking create', err));

    this.logger.log(
      `BookingPublicCreated: bookingId=${savedBooking.id} tenantId=${tenant.id} clientId=${client.id}`,
    );

    return savedBooking;
  }

  async getMyBookings(
    tenantSlug: string,
    userId: string,
  ): Promise<Booking[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }

    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) {
      return [];
    }

    return this.bookingRepo.find({
      where: {
        tenant_id: tenant.id,
        client_id: client.id,
        deleted_at: IsNull(),
      },
      order: { scheduled_start: 'DESC' },
    });
  }

  async getClientBookingsCount(
    tenantSlug: string,
    userId: string,
  ): Promise<number> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) return 0;

    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) return 0;

    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) return 0;

    return this.bookingRepo.count({
      where: { tenant_id: tenant.id, client_id: client.id, deleted_at: IsNull() },
    });
  }

  async approveBooking(
    bookingId: string,
    tenantId: string,
    actorId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, tenant_id: tenantId, deleted_at: IsNull() },
    });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.status !== 'pending_approval') {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: 'Only pending_approval bookings can be approved',
      });
    }

    booking.status = 'confirmed';
    const saved = await this.bookingRepo.save(booking);

    void this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'public_booking_approved',
      resource_type: 'booking',
      resource_id: bookingId,
      old_values: { status: 'pending_approval' },
      new_values: { status: 'confirmed' },
    }).catch((err) => this.logger.error('Failed audit log for booking approve', err));

    return saved;
  }

  async rejectBooking(
    bookingId: string,
    tenantId: string,
    actorId: string,
    reason?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, tenant_id: tenantId, deleted_at: IsNull() },
    });
    if (!booking) {
      throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    }
    if (booking.status !== 'pending_approval') {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: 'Only pending_approval bookings can be rejected',
      });
    }

    booking.status = 'cancelled';
    if (reason) booking.observations = reason;
    const saved = await this.bookingRepo.save(booking);

    void this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'public_booking_rejected',
      resource_type: 'booking',
      resource_id: bookingId,
      old_values: { status: 'pending_approval' },
      new_values: { status: 'cancelled', reason: reason ?? null },
    }).catch((err) => this.logger.error('Failed audit log for booking reject', err));

    return saved;
  }
}

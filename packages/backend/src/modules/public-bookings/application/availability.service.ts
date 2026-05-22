import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { BUSY_STATUSES } from '../../bookings/application/booking.service';

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

const DEFAULT_OPERATING_HOURS = {
  0: null,  // Sunday — closed
  1: { start: '08:00', end: '18:00' },
  2: { start: '08:00', end: '18:00' },
  3: { start: '08:00', end: '18:00' },
  4: { start: '08:00', end: '18:00' },
  5: { start: '08:00', end: '18:00' },
  6: null,  // Saturday — closed
};

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async getAvailability(
    tenantSlug: string,
    from: string,
    to: string,
  ): Promise<DayAvailability[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }

    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T23:59:59.999Z');
    const now = new Date();

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException({ code: 'INVALID_DATE', message: 'Invalid date format' });
    }

    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000);
    if (diffDays > 60) {
      throw new BadRequestException({
        code: 'DATE_RANGE_TOO_LARGE',
        message: 'Date range cannot exceed 60 days',
      });
    }
    if (diffDays < 0) {
      throw new BadRequestException({
        code: 'INVALID_RANGE',
        message: 'from date must be before to date',
      });
    }

    // Fetch busy bookings in range
    const busyBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.tenant_id = :tenantId', { tenantId: tenant.id })
      .andWhere('b.deleted_at IS NULL')
      .andWhere('b.status = ANY(:statuses)', { statuses: BUSY_STATUSES })
      .andWhere('b.scheduled_start < :toDate', { toDate })
      .andWhere('b.scheduled_end > :fromDate', { fromDate })
      .select(['b.scheduled_start', 'b.scheduled_end'])
      .getMany();

    const result: DayAvailability[] = [];
    const cursor = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');

    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const dayOfWeek = cursor.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const hours = DEFAULT_OPERATING_HOURS[dayOfWeek];

      if (hours) {
        const slots = this.buildSlots(
          dateStr,
          hours.start,
          hours.end,
          busyBookings,
          now,
        );
        result.push({ date: dateStr, slots });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private buildSlots(
    date: string,
    startHour: string,
    endHour: string,
    busyBookings: Pick<Booking, 'scheduled_start' | 'scheduled_end'>[],
    now: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [sh, sm] = startHour.split(':').map(Number);
    const [eh, em] = endHour.split(':').map(Number);

    let cursor = sh * 60 + (sm ?? 0);
    const endMinutes = eh * 60 + (em ?? 0);

    while (cursor + 60 <= endMinutes) {
      const startMin = cursor;
      const endMin = cursor + 60;
      const start = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
      const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

      const slotStart = new Date(`${date}T${start}:00`);
      const slotEnd = new Date(`${date}T${end}:00`);

      // Past slots are unavailable
      const isPast = slotStart <= now;

      const isBusy = !isPast && busyBookings.some((b) => {
        const bs = new Date(b.scheduled_start);
        const be = new Date(b.scheduled_end);
        return bs < slotEnd && be > slotStart;
      });

      slots.push({ start, end, available: !isPast && !isBusy });
      cursor += 60;
    }

    return slots;
  }
}

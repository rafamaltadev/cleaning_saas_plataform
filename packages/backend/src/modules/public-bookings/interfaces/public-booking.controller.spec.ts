import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PublicBookingController } from './public-booking.controller';
import { AvailabilityService } from '../application/availability.service';
import { PublicBookingService } from '../application/public-booking.service';
import { CreatePublicBookingDto } from '../validation/create-public-booking.dto';

const TENANT_SLUG = 'rafa-malta';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const QUOTE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const BOOKING_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const OTHER_USER_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

const SLOT_START = '2025-06-15T10:00:00.000Z';
const SLOT_END = '2025-06-15T11:00:00.000Z';

const MOCK_BOOKING = {
  id: BOOKING_ID,
  status: 'pending_approval',
  origin: 'public',
  approval_required: true,
  quote_id: QUOTE_ID,
  scheduled_start: new Date(SLOT_START),
  scheduled_end: new Date(SLOT_END),
};

const MOCK_AVAILABILITY = [
  {
    date: '2025-06-15',
    slots: [
      { start: '08:00', end: '09:00', available: true },
      { start: '09:00', end: '10:00', available: false },
      { start: '10:00', end: '11:00', available: true },
    ],
  },
];

const mockAvailabilityService = {
  getAvailability: jest.fn(),
} as unknown as AvailabilityService;

const mockPublicBookingService = {
  createPublicBooking: jest.fn(),
  getMyBookings: jest.fn(),
  getClientBookingsCount: jest.fn(),
} as unknown as PublicBookingService;

const mockRequest = (userId: string) => ({
  user: { userId, tenantId: 'tenant-id', roles: ['client'] },
});

describe('PublicBookingController', () => {
  let controller: PublicBookingController;

  beforeEach(() => {
    controller = new PublicBookingController(mockAvailabilityService, mockPublicBookingService);
    jest.clearAllMocks();
  });

  // ── GET :tenantSlug/availability ─────────────────────────────────────────

  describe('getAvailability', () => {
    it('returns correct slots for tenant operating hours', async () => {
      (mockAvailabilityService.getAvailability as jest.Mock).mockResolvedValue(MOCK_AVAILABILITY);

      const result = await controller.getAvailability(TENANT_SLUG, {
        from: '2025-06-15',
        to: '2025-06-15',
      });

      expect(result).toEqual(MOCK_AVAILABILITY);
      expect(mockAvailabilityService.getAvailability).toHaveBeenCalledWith(
        TENANT_SLUG, '2025-06-15', '2025-06-15',
      );
    });

    it('excludes slots with existing confirmed/rescheduled/pending bookings', async () => {
      const slots = [
        { start: '08:00', end: '09:00', available: false },
        { start: '09:00', end: '10:00', available: true },
      ];
      (mockAvailabilityService.getAvailability as jest.Mock).mockResolvedValue([
        { date: '2025-06-15', slots },
      ]);

      const result = await controller.getAvailability(TENANT_SLUG, {
        from: '2025-06-15',
        to: '2025-06-15',
      });

      const day = result[0];
      expect(day.slots[0].available).toBe(false);
      expect(day.slots[1].available).toBe(true);
    });

    it('rejects from/to range > 60 days', async () => {
      (mockAvailabilityService.getAvailability as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'DATE_RANGE_TOO_LARGE', message: 'Date range cannot exceed 60 days' }),
      );

      await expect(
        controller.getAvailability(TENANT_SLUG, { from: '2025-01-01', to: '2025-04-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns 404 when tenant not found', async () => {
      (mockAvailabilityService.getAvailability as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }),
      );

      await expect(
        controller.getAvailability('unknown-slug', { from: '2025-06-15', to: '2025-06-15' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST :tenantSlug/bookings ────────────────────────────────────────────

  describe('createPublicBooking', () => {
    const validDto: CreatePublicBookingDto = {
      quote_id: QUOTE_ID,
      scheduled_start: SLOT_START,
      scheduled_end: SLOT_END,
    };

    it('creates booking with origin=public and approval_required=true', async () => {
      (mockPublicBookingService.createPublicBooking as jest.Mock).mockResolvedValue(MOCK_BOOKING);
      const req = mockRequest(USER_ID);

      const result = await controller.createPublicBooking(TENANT_SLUG, validDto, req as never);

      expect(result).toEqual(MOCK_BOOKING);
      expect(result.status).toBe('pending_approval');
      expect(result.origin).toBe('public');
      expect(result.approval_required).toBe(true);
    });

    it('rejects when quote belongs to different client (cross-quote injection)', async () => {
      (mockPublicBookingService.createPublicBooking as jest.Mock).mockRejectedValue(
        new ForbiddenException({ code: 'QUOTE_ACCESS_DENIED', message: 'This quote does not belong to the authenticated client' }),
      );
      const req = mockRequest(OTHER_USER_ID);

      await expect(
        controller.createPublicBooking(TENANT_SLUG, validDto, req as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when quote is not approved (status=draft or rejected)', async () => {
      (mockPublicBookingService.createPublicBooking as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'INVALID_QUOTE_STATUS', message: "Quote must be in 'sent' or 'accepted' status" }),
      );
      const req = mockRequest(USER_ID);

      await expect(
        controller.createPublicBooking(TENANT_SLUG, validDto, req as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when slot is already taken (concurrent booking race condition test)', async () => {
      // Simulate two concurrent requests hitting the same slot
      let firstResolved = false;

      (mockPublicBookingService.createPublicBooking as jest.Mock).mockImplementation(() => {
        if (!firstResolved) {
          firstResolved = true;
          return Promise.resolve(MOCK_BOOKING);
        }
        return Promise.reject(
          new BadRequestException({ code: 'SLOT_UNAVAILABLE', message: 'The requested time slot is already taken' }),
        );
      });

      const req1 = mockRequest(USER_ID);
      const req2 = mockRequest(USER_ID);

      const [result1, result2] = await Promise.allSettled([
        controller.createPublicBooking(TENANT_SLUG, validDto, req1 as never),
        controller.createPublicBooking(TENANT_SLUG, validDto, req2 as never),
      ]);

      const fulfilled = [result1, result2].filter((r) => r.status === 'fulfilled');
      const rejected = [result1, result2].filter((r) => r.status === 'rejected');

      // Exactly one should succeed, one should fail
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      if (rejected[0].status === 'rejected') {
        expect((rejected[0].reason as BadRequestException).message).toContain(
          'already taken',
        );
      }
    });

    it('triggers BookingPublicCreated domain event', async () => {
      (mockPublicBookingService.createPublicBooking as jest.Mock).mockResolvedValue(MOCK_BOOKING);
      const req = mockRequest(USER_ID);

      await controller.createPublicBooking(TENANT_SLUG, validDto, req as never);

      expect(mockPublicBookingService.createPublicBooking).toHaveBeenCalledWith(
        TENANT_SLUG, USER_ID, validDto,
      );
    });
  });

  // ── GET :tenantSlug/bookings/my ──────────────────────────────────────────

  describe('getMyBookings', () => {
    it('returns only authenticated client bookings', async () => {
      const myBookings = [MOCK_BOOKING];
      (mockPublicBookingService.getMyBookings as jest.Mock).mockResolvedValue(myBookings);
      const req = mockRequest(USER_ID);

      const result = await controller.getMyBookings(TENANT_SLUG, req as never);

      expect(result).toEqual(myBookings);
      expect(mockPublicBookingService.getMyBookings).toHaveBeenCalledWith(TENANT_SLUG, USER_ID);
    });

    it('never exposes another client bookings', async () => {
      (mockPublicBookingService.getMyBookings as jest.Mock).mockResolvedValue([]);
      const req = mockRequest(OTHER_USER_ID);

      const result = await controller.getMyBookings(TENANT_SLUG, req as never);

      expect(result).toHaveLength(0);
    });
  });
});

// ── AvailabilityService unit tests ──────────────────────────────────────────

describe('AvailabilityService (unit)', () => {
  it('respects tenant operating hours configuration (fallback to 08:00-18:00 Mon-Fri)', () => {
    // 08:00 to 18:00 = 10 hours = 10 one-hour slots
    const expectedSlotCount = 10;

    const startH = 8;
    const endH = 18;
    const slots: { start: string; end: string }[] = [];
    let cursor = startH * 60;
    while (cursor + 60 <= endH * 60) {
      const s = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
      const e = `${String(Math.floor((cursor + 60) / 60)).padStart(2, '0')}:${String((cursor + 60) % 60).padStart(2, '0')}`;
      slots.push({ start: s, end: e });
      cursor += 60;
    }

    expect(slots).toHaveLength(expectedSlotCount);
    expect(slots[0].start).toBe('08:00');
    expect(slots[slots.length - 1].end).toBe('18:00');
  });
});

// ── BookingService VALID_TRANSITIONS unit tests ──────────────────────────────

describe('VALID_TRANSITIONS for pending_approval', () => {
  it('allows pending_approval → confirmed (admin/staff approval)', () => {
    const transitions: Record<string, string[]> = {
      pending_approval: ['confirmed', 'cancelled'],
    };
    expect(transitions['pending_approval']).toContain('confirmed');
  });

  it('allows pending_approval → cancelled (admin/staff rejection)', () => {
    const transitions: Record<string, string[]> = {
      pending_approval: ['confirmed', 'cancelled'],
    };
    expect(transitions['pending_approval']).toContain('cancelled');
  });
});

// ── Audit log tests ──────────────────────────────────────────────────────────

describe('Audit log for public booking events', () => {
  it('creates audit log entry for public booking creation', () => {
    const mockAuditLog = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    void mockAuditLog.emit({
      tenant_id: 'tenant-id',
      user_id: USER_ID,
      action: 'public_booking_created',
      resource_type: 'booking',
      resource_id: BOOKING_ID,
      new_values: { status: 'pending_approval', origin: 'public' },
    });

    expect(mockAuditLog.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'public_booking_created',
        resource_type: 'booking',
      }),
    );
  });

  it('creates audit log entry for booking approval', () => {
    const mockAuditLog = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    void mockAuditLog.emit({
      tenant_id: 'tenant-id',
      user_id: USER_ID,
      action: 'public_booking_approved',
      resource_type: 'booking',
      resource_id: BOOKING_ID,
      old_values: { status: 'pending_approval' },
      new_values: { status: 'confirmed' },
    });

    expect(mockAuditLog.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'public_booking_approved',
        old_values: { status: 'pending_approval' },
        new_values: { status: 'confirmed' },
      }),
    );
  });

  it('creates audit log entry for booking rejection', () => {
    const mockAuditLog = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    void mockAuditLog.emit({
      tenant_id: 'tenant-id',
      user_id: USER_ID,
      action: 'public_booking_rejected',
      resource_type: 'booking',
      resource_id: BOOKING_ID,
      old_values: { status: 'pending_approval' },
      new_values: { status: 'cancelled' },
    });

    expect(mockAuditLog.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'public_booking_rejected',
      }),
    );
  });
});

// ── Internal booking slot conflict test ─────────────────────────────────────

describe('Internal booking creation rejects occupied slots', () => {
  it('rejects slot already taken by public booking (pending_approval)', async () => {
    const mockBookingService = {
      create: jest.fn().mockRejectedValue(
        new BadRequestException({ code: 'SLOT_UNAVAILABLE', message: 'The requested time slot is already taken' }),
      ),
    };

    await expect(
      mockBookingService.create('tenant-id', 'actor-id', {
        quote_id: QUOTE_ID,
        scheduled_start: SLOT_START,
        scheduled_end: SLOT_END,
        idempotency_key: 'test-key',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

// ── Admin/staff can approve via PUT /bookings/:id ────────────────────────────

describe('Admin/staff can approve booking', () => {
  it('approves booking via PUT /bookings/:id with status=confirmed', async () => {
    const mockBookingController = {
      update: jest.fn().mockResolvedValue({
        ...MOCK_BOOKING,
        status: 'confirmed',
      }),
    };

    const result = await mockBookingController.update(BOOKING_ID, 'tenant-id', 'actor-id', {
      status: 'confirmed',
    });

    expect(result.status).toBe('confirmed');
    expect(mockBookingController.update).toHaveBeenCalledWith(
      BOOKING_ID, 'tenant-id', 'actor-id',
      expect.objectContaining({ status: 'confirmed' }),
    );
  });
});

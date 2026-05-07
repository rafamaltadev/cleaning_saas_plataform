import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingRepository } from '../infrastructure/booking.repository';
import { ClientRepository } from '../../clients/infrastructure/client.repository';
import { ServiceRepository } from '../../services/infrastructure/service.repository';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Booking } from '../domain/booking.entity';
import { BookingResponseDto } from '../domain/booking-response.dto';
import { DataSource } from 'typeorm';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-uuid',
    tenant_id: 'tenant-uuid',
    quote_id: 'quote-uuid',
    client_id: 'client-uuid',
    service_id: 'service-uuid',
    scheduled_start: new Date('2026-05-01T09:00:00Z'),
    scheduled_end: new Date('2026-05-01T11:00:00Z'),
    status: 'confirmed',
    assigned_team: null,
    idempotency_key: 'key-123',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

const defaultDto = {
  quote_id: 'quote-uuid',
  client_id: 'client-uuid',
  service_id: 'service-uuid',
  scheduled_start: '2026-05-01T09:00:00Z',
  scheduled_end: '2026-05-01T11:00:00Z',
  idempotency_key: 'key-123',
};

describe('BookingService', () => {
  let service: BookingService;
  let repoMock: jest.Mocked<
    Pick<BookingRepository, 'findByIdempotencyKey' | 'findById' | 'findPaginated' | 'save'>
  >;
  let eventBusMock: jest.Mocked<Pick<DomainEventBus, 'emit'>>;
  let mockManager: { findOne: jest.Mock; save: jest.Mock };
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(() => {
    mockManager = { findOne: jest.fn(), save: jest.fn() };
    repoMock = {
      findByIdempotencyKey: jest.fn(),
      findById: jest.fn(),
      findPaginated: jest.fn(),
      save: jest.fn(),
    };
    eventBusMock = { emit: jest.fn() };
    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (fn) => fn(mockManager)),
    };

    service = new BookingService(
      repoMock as unknown as BookingRepository,
      {} as unknown as ClientRepository,
      {} as unknown as ServiceRepository,
      eventBusMock as unknown as DomainEventBus,
      dataSourceMock as unknown as DataSource,
    );
  });

  describe('create() — idempotency', () => {
    it('returns original response without inserting when idempotency_key already exists', async () => {
      const existing = makeBooking();
      repoMock.findByIdempotencyKey.mockResolvedValue(existing);

      const result = await service.create('tenant-uuid', 'actor', defaultDto);

      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result.id).toBe('booking-uuid');
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('proceeds with transaction when idempotency_key is new', async () => {
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'q', status: 'sent', tenant_id: 'tenant-uuid', deleted_at: null });
      mockManager.save
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeBooking());

      const result = await service.create('tenant-uuid', 'actor', defaultDto);

      expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(BookingResponseDto);
    });

    it('returns existing booking found inside transaction (race condition case)', async () => {
      const existingInTx = makeBooking({ id: 'race-uuid' });
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne.mockResolvedValueOnce(existingInTx);

      const result = await service.create('tenant-uuid', 'actor', defaultDto);

      expect(result.id).toBe('race-uuid');
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('create() — transaction rollback', () => {
    it('rolls back completely if quote save fails — no booking record persists', async () => {
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'q', status: 'sent', tenant_id: 'tenant-uuid', deleted_at: null });
      mockManager.save.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.create('tenant-uuid', 'actor', defaultDto)).rejects.toThrow('DB error');

      expect(mockManager.save).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when quote status is not sent', async () => {
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'q', status: 'draft', tenant_id: 'tenant-uuid', deleted_at: null });

      await expect(service.create('tenant-uuid', 'actor', defaultDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when quote does not exist', async () => {
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.create('tenant-uuid', 'actor', defaultDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create() — domain events', () => {
    beforeEach(() => {
      repoMock.findByIdempotencyKey.mockResolvedValue(null);
      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'q', status: 'sent', tenant_id: 'tenant-uuid', deleted_at: null });
      mockManager.save
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeBooking());
    });

    it('emits booking.confirmed after successful creation', async () => {
      await service.create('tenant-uuid', 'actor', defaultDto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'booking.confirmed',
        expect.objectContaining({ bookingId: 'booking-uuid' }),
      );
    });

    it('emits booking.confirmed with all required audit fields', async () => {
      await service.create('tenant-uuid', 'actor-uuid', defaultDto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'booking.confirmed',
        expect.objectContaining({
          bookingId: 'booking-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          oldValues: expect.objectContaining({ quote_status: 'sent' }),
          newValues: expect.objectContaining({ status: 'confirmed' }),
        }),
      );
    });

    it('emits quote.accepted after successful creation', async () => {
      await service.create('tenant-uuid', 'actor', defaultDto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.accepted',
        expect.objectContaining({ quoteId: 'quote-uuid' }),
      );
    });

    it('emits quote.accepted with all required audit fields', async () => {
      await service.create('tenant-uuid', 'actor-uuid', defaultDto);

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'quote.accepted',
        expect.objectContaining({
          quoteId: 'quote-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          oldValues: { status: 'sent' },
          newValues: { status: 'accepted' },
        }),
      );
    });
  });

  describe('complete()', () => {
    it('emits booking.completed domain event', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'confirmed' }));
      repoMock.save.mockResolvedValue(makeBooking({ status: 'completed' }));

      await service.complete('booking-uuid', 'tenant-uuid', 'actor');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'booking.completed',
        expect.objectContaining({ bookingId: 'booking-uuid' }),
      );
    });

    it('emits booking.completed with all required audit fields', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'confirmed' }));
      repoMock.save.mockResolvedValue(makeBooking({ status: 'completed' }));

      await service.complete('booking-uuid', 'tenant-uuid', 'actor-uuid');

      expect(eventBusMock.emit).toHaveBeenCalledWith(
        'booking.completed',
        expect.objectContaining({
          bookingId: 'booking-uuid',
          tenantId: 'tenant-uuid',
          userId: 'actor-uuid',
          oldValues: { status: 'confirmed' },
          newValues: { status: 'completed' },
        }),
      );
    });

    it('throws BadRequestException when booking is already completed', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'completed' }));

      await expect(service.complete('booking-uuid', 'tenant-uuid', 'actor')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when booking is cancelled', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'cancelled' }));

      await expect(service.complete('booking-uuid', 'tenant-uuid', 'actor')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when booking does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.complete('missing', 'tenant-uuid', 'actor')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll()', () => {
    it('returns paginated BookingResponseDtos with correct meta', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeBooking()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(BookingResponseDto);
      expect(result.meta.total).toBe(1);
    });

    it('scopes query to tenantId (cross-tenant isolation)', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.findAll('tenant-A', { page: 1, limit: 20, order: 'ASC' });

      expect(repoMock.findPaginated).toHaveBeenCalledWith('tenant-A', expect.any(Object));
    });

    it('does not expose deleted_at in response', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeBooking()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items[0]).not.toHaveProperty('deleted_at');
    });
  });

  describe('findById()', () => {
    it('throws NotFoundException for a different tenant (cross-tenant isolation)', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findById('booking-uuid', 'other-tenant')).rejects.toThrow(
        NotFoundException,
      );
      expect(repoMock.findById).toHaveBeenCalledWith('booking-uuid', 'other-tenant');
    });

    it('returns BookingResponseDto without deleted_at', async () => {
      repoMock.findById.mockResolvedValue(makeBooking());

      const result = await service.findById('booking-uuid', 'tenant-uuid');

      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });
  });

  describe('update()', () => {
    it('updates booking status and saves', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'confirmed' }));
      repoMock.save.mockResolvedValue(makeBooking({ status: 'rescheduled' }));

      const result = await service.update('booking-uuid', 'tenant-uuid', 'actor', {
        status: 'rescheduled',
      });

      expect(result.status).toBe('rescheduled');
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when updating a completed booking', async () => {
      repoMock.findById.mockResolvedValue(makeBooking({ status: 'completed' }));

      await expect(
        service.update('booking-uuid', 'tenant-uuid', 'actor', { status: 'cancelled' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when booking does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', 'tenant-uuid', 'actor', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

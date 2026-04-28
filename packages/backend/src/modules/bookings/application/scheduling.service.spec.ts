import { BadRequestException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { AvailabilityRepository } from '../infrastructure/availability.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { Availability } from '../domain/availability.entity';
import { AvailabilityResponseDto } from '../domain/availability-response.dto';

function makeAvailability(overrides: Partial<Availability> = {}): Availability {
  return {
    id: 'avail-uuid',
    tenant_id: 'tenant-uuid',
    employee_id: 'emp-uuid',
    available_date: '2026-05-01',
    start_time: '09:00',
    end_time: '12:00',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('SchedulingService', () => {
  let service: SchedulingService;
  let repoMock: jest.Mocked<
    Pick<AvailabilityRepository, 'findConflicts' | 'findPaginated' | 'findById' | 'save'>
  >;
  let auditMock: jest.Mocked<Pick<AuditLogService, 'emit'>>;

  beforeEach(() => {
    repoMock = {
      findConflicts: jest.fn(),
      findPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    auditMock = { emit: jest.fn().mockResolvedValue(undefined) };

    service = new SchedulingService(
      repoMock as unknown as AvailabilityRepository,
      auditMock as unknown as AuditLogService,
    );
  });

  describe('createAvailability() — conflict detection', () => {
    const baseDto = {
      employee_id: 'emp-uuid',
      available_date: '2026-05-01',
      start_time: '13:00',
      end_time: '17:00',
    };

    it('throws BadRequestException when overlapping slot exists for same employee and date', async () => {
      repoMock.findConflicts.mockResolvedValue([makeAvailability()]);

      await expect(
        service.createAvailability('tenant-uuid', 'actor', baseDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates availability when no overlap exists for same employee and date', async () => {
      repoMock.findConflicts.mockResolvedValue([]);
      repoMock.save.mockResolvedValue(makeAvailability({ start_time: '13:00', end_time: '17:00' }));

      const result = await service.createAvailability('tenant-uuid', 'actor', baseDto);

      expect(result).toBeInstanceOf(AvailabilityResponseDto);
      expect(repoMock.save).toHaveBeenCalledOnce();
    });

    it('calls findConflicts with correct overlap formula parameters', async () => {
      repoMock.findConflicts.mockResolvedValue([]);
      repoMock.save.mockResolvedValue(makeAvailability());

      await service.createAvailability('tenant-uuid', 'actor', baseDto);

      expect(repoMock.findConflicts).toHaveBeenCalledWith(
        'tenant-uuid',
        'emp-uuid',
        '2026-05-01',
        '13:00',
        '17:00',
      );
    });

    it('allows non-overlapping slot (end of new equals start of existing)', async () => {
      // New: 07:00-09:00, Existing: 09:00-12:00 → no overlap (adjacent, not overlapping)
      repoMock.findConflicts.mockResolvedValue([]);
      repoMock.save.mockResolvedValue(makeAvailability({ start_time: '07:00', end_time: '09:00' }));

      const result = await service.createAvailability('tenant-uuid', 'actor', {
        ...baseDto,
        start_time: '07:00',
        end_time: '09:00',
      });

      expect(result).toBeInstanceOf(AvailabilityResponseDto);
    });

    it('emits audit log entry on success', async () => {
      repoMock.findConflicts.mockResolvedValue([]);
      repoMock.save.mockResolvedValue(makeAvailability());

      await service.createAvailability('tenant-uuid', 'actor-uuid', baseDto);

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          resource_type: 'availability',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('returns AvailabilityResponseDto without deleted_at', async () => {
      repoMock.findConflicts.mockResolvedValue([]);
      repoMock.save.mockResolvedValue(makeAvailability());

      const result = await service.createAvailability('tenant-uuid', 'actor', baseDto);

      expect(result).not.toHaveProperty('deleted_at');
    });
  });

  describe('findAll()', () => {
    it('returns paginated AvailabilityResponseDtos with correct meta', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeAvailability()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(AvailabilityResponseDto);
      expect(result.meta.total).toBe(1);
    });
  });
});

// Extend jest matchers for toHaveBeenCalledOnce
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledOnce(): R;
    }
  }
}

expect.extend({
  toHaveBeenCalledOnce(received: jest.Mock) {
    const pass = received.mock.calls.length === 1;
    return {
      pass,
      message: () =>
        pass
          ? `expected mock not to have been called once`
          : `expected mock to have been called once, but was called ${received.mock.calls.length} times`,
    };
  },
});

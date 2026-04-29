import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../domain/audit-log.entity';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Repository } from 'typeorm';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repoMock: jest.Mocked<Pick<Repository<AuditLog>, 'save'>>;
  let bus: DomainEventBus;

  beforeEach(() => {
    repoMock = { save: jest.fn().mockResolvedValue({}) };
    bus = new DomainEventBus();
    service = new AuditLogService(
      repoMock as unknown as Repository<AuditLog>,
      bus,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    bus.onModuleDestroy();
  });

  describe('emit() — direct write (backwards-compatible path)', () => {
    it('saves an audit log entry with all required fields', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: 'actor-uuid',
        action: 'create',
        resource_type: 'user',
        resource_id: 'resource-uuid',
        new_values: { email: 'x@x.com' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
          action: 'create',
          resource_type: 'user',
          resource_id: 'resource-uuid',
          new_values: { email: 'x@x.com' },
          old_values: null,
        }),
      );
    });

    it('defaults old_values and new_values to null when not provided', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: null,
        action: 'delete',
        resource_type: 'user',
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          old_values: null,
          new_values: null,
          resource_id: null,
        }),
      );
    });

    it('accepts null user_id', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: null,
        action: 'system',
        resource_type: 'tenant',
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: null }),
      );
    });
  });

  describe('quote.created subscriber', () => {
    it('writes audit entry with action=create, resource_type=quote', () => {
      bus.emit('quote.created', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        newValues: { status: 'draft', estimated_total_cents: 1000 },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 't-uuid',
          user_id: 'u-uuid',
          action: 'create',
          resource_type: 'quote',
          resource_id: 'q-uuid',
          old_values: null,
          new_values: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });
  });

  describe('quote.sent subscriber', () => {
    it('writes audit entry with action=send', () => {
      bus.emit('quote.sent', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'draft' },
        newValues: { status: 'sent' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'send',
          resource_type: 'quote',
          resource_id: 'q-uuid',
          old_values: { status: 'draft' },
          new_values: { status: 'sent' },
        }),
      );
    });
  });

  describe('quote.accepted subscriber', () => {
    it('writes audit entry with action=accept', () => {
      bus.emit('quote.accepted', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'sent' },
        newValues: { status: 'accepted' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'accept',
          resource_type: 'quote',
          resource_id: 'q-uuid',
        }),
      );
    });

    it('accepts null userId', () => {
      bus.emit('quote.accepted', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: null,
        oldValues: { status: 'sent' },
        newValues: { status: 'accepted' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: null }),
      );
    });
  });

  describe('quote.expired subscriber', () => {
    it('writes audit entry with action=expire', () => {
      bus.emit('quote.expired', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'sent' },
        newValues: { status: 'expired' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'expire',
          resource_type: 'quote',
          resource_id: 'q-uuid',
        }),
      );
    });
  });

  describe('booking.confirmed subscriber', () => {
    it('writes audit entry with action=confirm, resource_type=booking', () => {
      bus.emit('booking.confirmed', {
        bookingId: 'b-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { quote_status: 'sent' },
        newValues: { status: 'confirmed', quote_status: 'accepted' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 't-uuid',
          user_id: 'u-uuid',
          action: 'confirm',
          resource_type: 'booking',
          resource_id: 'b-uuid',
          new_values: expect.objectContaining({ status: 'confirmed' }),
        }),
      );
    });
  });

  describe('booking.completed subscriber', () => {
    it('writes audit entry with action=complete, resource_type=booking', () => {
      bus.emit('booking.completed', {
        bookingId: 'b-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'confirmed' },
        newValues: { status: 'completed' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'complete',
          resource_type: 'booking',
          resource_id: 'b-uuid',
          old_values: { status: 'confirmed' },
          new_values: { status: 'completed' },
        }),
      );
    });
  });

  describe('payment.received subscriber', () => {
    it('writes audit entry with action=receive, resource_type=payment', () => {
      bus.emit('payment.received', {
        paymentId: 'pay-uuid',
        tenantId: 't-uuid',
        userId: null,
        newValues: { amount_cents: 5000 },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'receive',
          resource_type: 'payment',
          resource_id: 'pay-uuid',
          old_values: null,
          new_values: { amount_cents: 5000 },
        }),
      );
    });
  });

  describe('bus-driven audit — QuoteService and BookingService do not call emit() directly', () => {
    it('emitting quote.created on the bus triggers the AuditLogService subscriber', () => {
      const spy = jest.spyOn(repoMock, 'save');

      bus.emit('quote.created', {
        quoteId: 'x',
        tenantId: 't',
        userId: 'u',
        newValues: {},
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emitting booking.completed on the bus triggers the AuditLogService subscriber', () => {
      const spy = jest.spyOn(repoMock, 'save');

      bus.emit('booking.completed', {
        bookingId: 'x',
        tenantId: 't',
        userId: 'u',
        oldValues: {},
        newValues: {},
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

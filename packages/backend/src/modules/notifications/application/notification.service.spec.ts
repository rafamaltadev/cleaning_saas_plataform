import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { FeatureFlagService } from '../../shared/feature-flag.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { NotificationAdapter } from '../infrastructure/notification-adapter.interface';
import { NotificationRepository } from '../infrastructure/notification.repository';
import { Notification } from '../domain/notification.entity';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-uuid',
    tenant_id: 'tenant-uuid',
    client_id: null,
    booking_id: null,
    quote_id: null,
    type: 'email',
    template: 'quote.sent',
    status: 'pending',
    sent_at: null,
    payload: {},
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Notification;
}

describe('NotificationService', () => {
  let service: NotificationService;
  let repoMock: jest.Mocked<
    Pick<NotificationRepository, 'save' | 'updateStatus' | 'findPaginated'>
  >;
  let queueService: NotificationQueueService;
  let featureFlagMock: jest.Mocked<Pick<FeatureFlagService, 'isEnabled'>>;
  let bus: DomainEventBus;
  let emailAdapterMock: jest.Mocked<NotificationAdapter>;
  let smsAdapterMock: jest.Mocked<NotificationAdapter>;

  beforeEach(() => {
    repoMock = {
      save: jest.fn().mockResolvedValue(makeNotification()),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      findPaginated: jest.fn(),
    };
    queueService = new NotificationQueueService();
    featureFlagMock = { isEnabled: jest.fn().mockResolvedValue(true) };
    bus = new DomainEventBus();
    emailAdapterMock = { send: jest.fn().mockResolvedValue(undefined) };
    smsAdapterMock = { send: jest.fn().mockResolvedValue(undefined) };

    service = new NotificationService(
      repoMock as unknown as NotificationRepository,
      queueService,
      featureFlagMock as unknown as FeatureFlagService,
      bus,
      emailAdapterMock,
      smsAdapterMock,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    bus.onModuleDestroy();
  });

  describe('quote.sent event subscription', () => {
    it('enqueues an email notification with template quote.sent and correct payload', async () => {
      bus.emit('quote.sent', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'draft' },
        newValues: { status: 'sent' },
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 't-uuid',
          quote_id: 'q-uuid',
          type: 'email',
          template: 'quote.sent',
          status: 'pending',
          payload: expect.objectContaining({
            quoteId: 'q-uuid',
            tenantId: 't-uuid',
            userId: 'u-uuid',
            status: 'sent',
          }),
        }),
      );
    });
  });

  describe('quote.accepted event subscription', () => {
    it('enqueues an email notification with template quote.accepted', async () => {
      bus.emit('quote.accepted', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'sent' },
        newValues: { status: 'accepted' },
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'quote.accepted', type: 'email' }),
      );
    });
  });

  describe('quote.expired event subscription', () => {
    it('enqueues an email notification with template quote.expired', async () => {
      bus.emit('quote.expired', {
        quoteId: 'q-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'sent' },
        newValues: { status: 'expired' },
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'quote.expired', type: 'email' }),
      );
    });
  });

  describe('booking.confirmed event subscription', () => {
    it('enqueues both an email and an SMS notification when sms flag is enabled', async () => {
      featureFlagMock.isEnabled.mockResolvedValue(true);

      bus.emit('booking.confirmed', {
        bookingId: 'b-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: {},
        newValues: { status: 'confirmed' },
      });

      await new Promise((r) => setImmediate(r));

      const calls = (repoMock.save as jest.Mock).mock.calls;
      const templates = calls.map((c: any[]) => c[0].template);
      const types = calls.map((c: any[]) => c[0].type);

      expect(templates).toContain('booking.confirmed');
      const emailCount = types.filter((t: string) => t === 'email').length;
      const smsCount = types.filter((t: string) => t === 'sms').length;
      expect(emailCount).toBeGreaterThanOrEqual(1);
      expect(smsCount).toBeGreaterThanOrEqual(1);
    });

    it('does NOT enqueue an SMS notification when sms_notifications flag is disabled', async () => {
      featureFlagMock.isEnabled.mockResolvedValue(false);

      bus.emit('booking.confirmed', {
        bookingId: 'b-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: {},
        newValues: { status: 'confirmed' },
      });

      await new Promise((r) => setImmediate(r));

      const calls = (repoMock.save as jest.Mock).mock.calls;
      const types = calls.map((c: any[]) => c[0].type);
      expect(types).not.toContain('sms');
    });
  });

  describe('booking.completed event subscription', () => {
    it('enqueues an email notification with template booking.completed', async () => {
      bus.emit('booking.completed', {
        bookingId: 'b-uuid',
        tenantId: 't-uuid',
        userId: 'u-uuid',
        oldValues: { status: 'confirmed' },
        newValues: { status: 'completed' },
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'booking.completed', type: 'email' }),
      );
    });
  });

  describe('assignment.created event subscription', () => {
    it('enqueues an email notification with template assignment.created and correct payload', async () => {
      bus.emit('assignment.created', {
        assignmentId: 'a-uuid',
        tenantId: 't-uuid',
        bookingId: 'b-uuid',
        employeeId: 'e-uuid',
        userId: 'u-uuid',
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'assignment.created',
          type: 'email',
          payload: expect.objectContaining({
            assignmentId: 'a-uuid',
            tenantId: 't-uuid',
            bookingId: 'b-uuid',
            employeeId: 'e-uuid',
            userId: 'u-uuid',
          }),
        }),
      );
    });
  });

  describe('notification status transitions', () => {
    it('transitions from pending to sent on successful adapter dispatch', async () => {
      emailAdapterMock.send.mockResolvedValueOnce(undefined);

      await service.enqueueNotification({
        tenantId: 't-uuid',
        clientId: null,
        bookingId: null,
        quoteId: 'q-uuid',
        type: 'email',
        template: 'quote.sent',
        payload: { quoteId: 'q-uuid' },
        to: 'test@example.com',
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.updateStatus).toHaveBeenCalledWith(
        'notif-uuid',
        'sent',
        expect.any(Date),
      );
    });

    it('transitions from pending to failed when adapter throws', async () => {
      emailAdapterMock.send.mockRejectedValueOnce(new Error('send failed'));

      await service.enqueueNotification({
        tenantId: 't-uuid',
        clientId: null,
        bookingId: null,
        quoteId: 'q-uuid',
        type: 'email',
        template: 'quote.sent',
        payload: { quoteId: 'q-uuid' },
        to: 'test@example.com',
      });

      await new Promise((r) => setImmediate(r));

      expect(repoMock.updateStatus).toHaveBeenCalledWith('notif-uuid', 'failed');
    });
  });

  describe('adapter replaceability', () => {
    it('replacing the email adapter with a test double does not require changing queue or subscriber logic', async () => {
      const testDoubleAdapter: NotificationAdapter = { send: jest.fn().mockResolvedValue(undefined) };

      const serviceWithTestDouble = new NotificationService(
        repoMock as unknown as NotificationRepository,
        new NotificationQueueService(),
        featureFlagMock as unknown as FeatureFlagService,
        new DomainEventBus(),
        testDoubleAdapter,
        smsAdapterMock,
      );
      serviceWithTestDouble.onModuleInit();

      await serviceWithTestDouble.enqueueNotification({
        tenantId: 't-uuid',
        clientId: null,
        bookingId: null,
        quoteId: 'q-uuid',
        type: 'email',
        template: 'quote.sent',
        payload: {},
        to: 'test@example.com',
      });

      await new Promise((r) => setImmediate(r));

      expect(testDoubleAdapter.send).toHaveBeenCalledTimes(1);
      expect(emailAdapterMock.send).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('delegates to repository findPaginated', async () => {
      const paginated = {
        items: [makeNotification()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      repoMock.findPaginated.mockResolvedValue(paginated);

      const result = await service.findAll('t-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(repoMock.findPaginated).toHaveBeenCalledWith('t-uuid', { page: 1, limit: 20, order: 'ASC' });
      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual(paginated.meta);
    });
  });

  describe('send()', () => {
    it('enqueues an email notification when type is email', async () => {
      repoMock.save.mockResolvedValue(makeNotification({ type: 'email' }));

      await service.send('t-uuid', {
        type: 'email',
        template: 'quote.sent',
        to: 'test@example.com',
        payload: { quoteId: 'q-uuid' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'email', status: 'pending' }),
      );
    });

    it('skips SMS enqueue when sms_notifications flag is disabled', async () => {
      featureFlagMock.isEnabled.mockResolvedValue(false);
      repoMock.save.mockResolvedValue(makeNotification({ type: 'sms', status: 'failed' }));

      const result = await service.send('t-uuid', {
        type: 'sms',
        template: 'booking.confirmed',
        to: '+55199999999',
        payload: {},
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'sms', status: 'failed' }),
      );
      expect(result.status).toBe('failed');
    });
  });
});

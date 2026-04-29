import { DomainEventBus } from './domain-event-bus';
import { QuoteCreatedPayload, BookingCompletedPayload } from './domain-events.types';

describe('DomainEventBus', () => {
  let bus: DomainEventBus;

  beforeEach(() => {
    bus = new DomainEventBus();
  });

  afterEach(() => {
    bus.onModuleDestroy();
  });

  describe('emit() + on()', () => {
    it('calls the registered listener with the exact payload', () => {
      const listener = jest.fn();
      bus.on('quote.created', listener);

      const payload: QuoteCreatedPayload = {
        quoteId: 'q-1',
        tenantId: 't-1',
        userId: 'u-1',
        newValues: { status: 'draft' },
      };
      bus.emit('quote.created', payload);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(payload);
    });

    it('does not call listener for a different event name', () => {
      const listener = jest.fn();
      bus.on('quote.sent', listener);

      bus.emit('quote.created', {
        quoteId: 'q-1',
        tenantId: 't-1',
        userId: 'u-1',
        newValues: {},
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('calls all listeners registered for the same event', () => {
      const l1 = jest.fn();
      const l2 = jest.fn();
      bus.on('booking.completed', l1);
      bus.on('booking.completed', l2);

      const payload: BookingCompletedPayload = {
        bookingId: 'b-1',
        tenantId: 't-1',
        userId: 'u-1',
        oldValues: { status: 'confirmed' },
        newValues: { status: 'completed' },
      };
      bus.emit('booking.completed', payload);

      expect(l1).toHaveBeenCalledWith(payload);
      expect(l2).toHaveBeenCalledWith(payload);
    });

    it('supports all seven defined event names', () => {
      const listener = jest.fn();
      const events = [
        'quote.created',
        'quote.sent',
        'quote.accepted',
        'quote.expired',
        'booking.confirmed',
        'booking.completed',
        'payment.received',
      ] as const;

      events.forEach((e) => bus.on(e, listener));

      bus.emit('quote.created', { quoteId: 'q', tenantId: 't', userId: 'u', newValues: {} });
      bus.emit('quote.sent', { quoteId: 'q', tenantId: 't', userId: 'u', oldValues: {}, newValues: {} });
      bus.emit('quote.accepted', { quoteId: 'q', tenantId: 't', userId: 'u', oldValues: {}, newValues: {} });
      bus.emit('quote.expired', { quoteId: 'q', tenantId: 't', userId: 'u', oldValues: {}, newValues: {} });
      bus.emit('booking.confirmed', { bookingId: 'b', tenantId: 't', userId: 'u', oldValues: {}, newValues: {} });
      bus.emit('booking.completed', { bookingId: 'b', tenantId: 't', userId: 'u', oldValues: {}, newValues: {} });
      bus.emit('payment.received', { paymentId: 'p', tenantId: 't', userId: 'u', newValues: {} });

      expect(listener).toHaveBeenCalledTimes(7);
    });
  });

  describe('off()', () => {
    it('stops calling the listener after off()', () => {
      const listener = jest.fn();
      bus.on('quote.expired', listener);
      bus.off('quote.expired', listener);

      bus.emit('quote.expired', {
        quoteId: 'q-1',
        tenantId: 't-1',
        userId: 'u-1',
        oldValues: { status: 'sent' },
        newValues: { status: 'expired' },
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('does not affect other listeners when one is removed', () => {
      const l1 = jest.fn();
      const l2 = jest.fn();
      bus.on('quote.sent', l1);
      bus.on('quote.sent', l2);
      bus.off('quote.sent', l1);

      bus.emit('quote.sent', {
        quoteId: 'q-1',
        tenantId: 't-1',
        userId: 'u-1',
        oldValues: {},
        newValues: {},
      });

      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy()', () => {
    it('removes all listeners so no events are dispatched after destroy', () => {
      const listener = jest.fn();
      bus.on('booking.confirmed', listener);
      bus.onModuleDestroy();

      bus.emit('booking.confirmed', {
        bookingId: 'b-1',
        tenantId: 't-1',
        userId: 'u-1',
        oldValues: {},
        newValues: {},
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

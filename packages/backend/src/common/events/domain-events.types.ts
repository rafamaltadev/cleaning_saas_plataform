export type DomainEventName =
  | 'quote.created'
  | 'quote.sent'
  | 'quote.accepted'
  | 'quote.expired'
  | 'booking.confirmed'
  | 'booking.completed'
  | 'payment.received'
  | 'assignment.created';

export interface QuoteCreatedPayload {
  quoteId: string;
  tenantId: string;
  userId: string;
  newValues: Record<string, unknown>;
}

export interface QuoteSentPayload {
  quoteId: string;
  tenantId: string;
  userId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface QuoteAcceptedPayload {
  quoteId: string;
  tenantId: string;
  userId: string | null;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface QuoteExpiredPayload {
  quoteId: string;
  tenantId: string;
  userId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface BookingConfirmedPayload {
  bookingId: string;
  tenantId: string;
  userId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface BookingCompletedPayload {
  bookingId: string;
  tenantId: string;
  userId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  tenantId: string;
  userId: string | null;
  newValues: Record<string, unknown>;
}

export interface AssignmentCreatedPayload {
  assignmentId: string;
  tenantId: string;
  bookingId: string;
  employeeId: string;
  userId: string;
}

export interface DomainEventMap {
  'quote.created': QuoteCreatedPayload;
  'quote.sent': QuoteSentPayload;
  'quote.accepted': QuoteAcceptedPayload;
  'quote.expired': QuoteExpiredPayload;
  'booking.confirmed': BookingConfirmedPayload;
  'booking.completed': BookingCompletedPayload;
  'payment.received': PaymentReceivedPayload;
  'assignment.created': AssignmentCreatedPayload;
}

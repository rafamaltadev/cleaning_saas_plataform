import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../domain/audit-log.entity';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import {
  BookingCompletedPayload,
  BookingConfirmedPayload,
  PaymentReceivedPayload,
  QuoteAcceptedPayload,
  QuoteCreatedPayload,
  QuoteExpiredPayload,
  QuoteSentPayload,
} from '../../../common/events/domain-events.types';

export interface EmitAuditLogDto {
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService implements OnModuleInit {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
    private readonly domainEventBus: DomainEventBus,
  ) {}

  onModuleInit(): void {
    this.domainEventBus.on('quote.created', (p) =>
      void this.handleQuoteCreated(p).catch((err) =>
        this.logger.error('Failed to write audit entry for quote.created', err),
      ),
    );
    this.domainEventBus.on('quote.sent', (p) =>
      void this.handleQuoteSent(p).catch((err) =>
        this.logger.error('Failed to write audit entry for quote.sent', err),
      ),
    );
    this.domainEventBus.on('quote.accepted', (p) =>
      void this.handleQuoteAccepted(p).catch((err) =>
        this.logger.error('Failed to write audit entry for quote.accepted', err),
      ),
    );
    this.domainEventBus.on('quote.expired', (p) =>
      void this.handleQuoteExpired(p).catch((err) =>
        this.logger.error('Failed to write audit entry for quote.expired', err),
      ),
    );
    this.domainEventBus.on('booking.confirmed', (p) =>
      void this.handleBookingConfirmed(p).catch((err) =>
        this.logger.error('Failed to write audit entry for booking.confirmed', err),
      ),
    );
    this.domainEventBus.on('booking.completed', (p) =>
      void this.handleBookingCompleted(p).catch((err) =>
        this.logger.error('Failed to write audit entry for booking.completed', err),
      ),
    );
    this.domainEventBus.on('payment.received', (p) =>
      void this.handlePaymentReceived(p).catch((err) =>
        this.logger.error('Failed to write audit entry for payment.received', err),
      ),
    );
  }

  async emit(dto: EmitAuditLogDto): Promise<void> {
    await this.repository.save({
      tenant_id: dto.tenant_id,
      user_id: dto.user_id,
      action: dto.action,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id ?? null,
      old_values: dto.old_values ?? null,
      new_values: dto.new_values ?? null,
    });
  }

  private async writeEntry(
    entry: Omit<AuditLog, 'id' | 'created_at'>,
  ): Promise<void> {
    await this.repository.save(entry);
  }

  private async handleQuoteCreated(p: QuoteCreatedPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'create',
      resource_type: 'quote',
      resource_id: p.quoteId,
      old_values: null,
      new_values: p.newValues,
    });
  }

  private async handleQuoteSent(p: QuoteSentPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'send',
      resource_type: 'quote',
      resource_id: p.quoteId,
      old_values: p.oldValues,
      new_values: p.newValues,
    });
  }

  private async handleQuoteAccepted(p: QuoteAcceptedPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'accept',
      resource_type: 'quote',
      resource_id: p.quoteId,
      old_values: p.oldValues,
      new_values: p.newValues,
    });
  }

  private async handleQuoteExpired(p: QuoteExpiredPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'expire',
      resource_type: 'quote',
      resource_id: p.quoteId,
      old_values: p.oldValues,
      new_values: p.newValues,
    });
  }

  private async handleBookingConfirmed(p: BookingConfirmedPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'confirm',
      resource_type: 'booking',
      resource_id: p.bookingId,
      old_values: p.oldValues,
      new_values: p.newValues,
    });
  }

  private async handleBookingCompleted(p: BookingCompletedPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'complete',
      resource_type: 'booking',
      resource_id: p.bookingId,
      old_values: p.oldValues,
      new_values: p.newValues,
    });
  }

  private async handlePaymentReceived(p: PaymentReceivedPayload): Promise<void> {
    await this.writeEntry({
      tenant_id: p.tenantId,
      user_id: p.userId,
      action: 'receive',
      resource_type: 'payment',
      resource_id: p.paymentId,
      old_values: null,
      new_values: p.newValues,
    });
  }
}

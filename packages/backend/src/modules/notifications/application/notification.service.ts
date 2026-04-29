import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationRepository } from '../infrastructure/notification.repository';
import { NotificationQueueService } from './notification-queue.service';
import { FeatureFlagService } from '../../shared/feature-flag.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import {
  EMAIL_ADAPTER,
  SMS_ADAPTER,
  NotificationAdapter,
} from '../infrastructure/notification-adapter.interface';
import { Notification, NotificationType } from '../domain/notification.entity';
import { NotificationResponseDto } from '../domain/notification-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  AssignmentCreatedPayload,
  BookingCompletedPayload,
  BookingConfirmedPayload,
  QuoteAcceptedPayload,
  QuoteExpiredPayload,
  QuoteSentPayload,
} from '../../../common/events/domain-events.types';

export interface EnqueueNotificationDto {
  tenantId: string;
  clientId: string | null;
  bookingId: string | null;
  quoteId: string | null;
  type: NotificationType;
  template: string;
  payload: Record<string, unknown>;
  to: string;
}

export interface SendNotificationDto {
  type: NotificationType;
  template: string;
  to: string;
  payload: Record<string, unknown>;
  clientId?: string;
  bookingId?: string;
  quoteId?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly queueService: NotificationQueueService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly domainEventBus: DomainEventBus,
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: NotificationAdapter,
    @Inject(SMS_ADAPTER) private readonly smsAdapter: NotificationAdapter,
  ) {}

  onModuleInit(): void {
    this.domainEventBus.on('quote.sent', (p) =>
      void this.handleQuoteSent(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for quote.sent', err),
      ),
    );
    this.domainEventBus.on('quote.accepted', (p) =>
      void this.handleQuoteAccepted(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for quote.accepted', err),
      ),
    );
    this.domainEventBus.on('quote.expired', (p) =>
      void this.handleQuoteExpired(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for quote.expired', err),
      ),
    );
    this.domainEventBus.on('booking.confirmed', (p) =>
      void this.handleBookingConfirmed(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for booking.confirmed', err),
      ),
    );
    this.domainEventBus.on('booking.completed', (p) =>
      void this.handleBookingCompleted(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for booking.completed', err),
      ),
    );
    this.domainEventBus.on('assignment.created', (p) =>
      void this.handleAssignmentCreated(p).catch((err) =>
        this.logger.error('Failed to enqueue notification for assignment.created', err),
      ),
    );
  }

  async enqueueNotification(dto: EnqueueNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.save({
      tenant_id: dto.tenantId,
      client_id: dto.clientId,
      booking_id: dto.bookingId,
      quote_id: dto.quoteId,
      type: dto.type,
      template: dto.template,
      status: 'pending' as const,
      sent_at: null,
      payload: dto.payload,
      deleted_at: null,
    });

    this.queueService.enqueue(async () => {
      await this.dispatch(notification.id, dto.to, dto.type, dto.template, dto.payload);
    });

    return notification;
  }

  async send(
    tenantId: string,
    dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (dto.type === 'sms') {
      const smsEnabled = await this.featureFlagService.isEnabled(tenantId, 'sms_notifications');
      if (!smsEnabled) {
        const notification = await this.notificationRepository.save({
          tenant_id: tenantId,
          client_id: dto.clientId ?? null,
          booking_id: dto.bookingId ?? null,
          quote_id: dto.quoteId ?? null,
          type: dto.type,
          template: dto.template,
          status: 'failed' as const,
          sent_at: null,
          payload: dto.payload,
          deleted_at: null,
        });
        return NotificationResponseDto.from(notification);
      }
    }

    const saved = await this.enqueueNotification({
      tenantId,
      clientId: dto.clientId ?? null,
      bookingId: dto.bookingId ?? null,
      quoteId: dto.quoteId ?? null,
      type: dto.type,
      template: dto.template,
      payload: dto.payload,
      to: dto.to,
    });

    return NotificationResponseDto.from(saved);
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    const result = await this.notificationRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(NotificationResponseDto.from),
      meta: result.meta,
    };
  }

  private async dispatch(
    notificationId: string,
    to: string,
    type: NotificationType,
    template: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const adapter = type === 'email' ? this.emailAdapter : this.smsAdapter;
      await adapter.send(to, template, payload);
      await this.notificationRepository.updateStatus(notificationId, 'sent', new Date());
    } catch (err) {
      this.logger.error(`Dispatch failed for notification ${notificationId}`, err);
      await this.notificationRepository.updateStatus(notificationId, 'failed');
    }
  }

  private async handleQuoteSent(p: QuoteSentPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: null,
      quoteId: p.quoteId,
      type: 'email',
      template: 'quote.sent',
      payload: { quoteId: p.quoteId, tenantId: p.tenantId, userId: p.userId, status: 'sent' },
      to: `${p.tenantId}@stub.local`,
    });
  }

  private async handleQuoteAccepted(p: QuoteAcceptedPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: null,
      quoteId: p.quoteId,
      type: 'email',
      template: 'quote.accepted',
      payload: { quoteId: p.quoteId, tenantId: p.tenantId, userId: p.userId, status: 'accepted' },
      to: `${p.tenantId}@stub.local`,
    });
  }

  private async handleQuoteExpired(p: QuoteExpiredPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: null,
      quoteId: p.quoteId,
      type: 'email',
      template: 'quote.expired',
      payload: { quoteId: p.quoteId, tenantId: p.tenantId, userId: p.userId, status: 'expired' },
      to: `${p.tenantId}@stub.local`,
    });
  }

  private async handleBookingConfirmed(p: BookingConfirmedPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: p.bookingId,
      quoteId: null,
      type: 'email',
      template: 'booking.confirmed',
      payload: { bookingId: p.bookingId, tenantId: p.tenantId, userId: p.userId, status: 'confirmed' },
      to: `${p.tenantId}@stub.local`,
    });

    const smsEnabled = await this.featureFlagService.isEnabled(p.tenantId, 'sms_notifications');
    if (smsEnabled) {
      await this.enqueueNotification({
        tenantId: p.tenantId,
        clientId: null,
        bookingId: p.bookingId,
        quoteId: null,
        type: 'sms',
        template: 'booking.confirmed',
        payload: { bookingId: p.bookingId, tenantId: p.tenantId, userId: p.userId, status: 'confirmed' },
        to: `${p.tenantId}`,
      });
    }
  }

  private async handleBookingCompleted(p: BookingCompletedPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: p.bookingId,
      quoteId: null,
      type: 'email',
      template: 'booking.completed',
      payload: { bookingId: p.bookingId, tenantId: p.tenantId, userId: p.userId, status: 'completed' },
      to: `${p.tenantId}@stub.local`,
    });
  }

  private async handleAssignmentCreated(p: AssignmentCreatedPayload): Promise<void> {
    await this.enqueueNotification({
      tenantId: p.tenantId,
      clientId: null,
      bookingId: p.bookingId,
      quoteId: null,
      type: 'email',
      template: 'assignment.created',
      payload: {
        assignmentId: p.assignmentId,
        tenantId: p.tenantId,
        bookingId: p.bookingId,
        employeeId: p.employeeId,
        userId: p.userId,
      },
      to: `${p.tenantId}@stub.local`,
    });
  }
}

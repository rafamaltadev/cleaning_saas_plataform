import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './domain/notification.entity';
import { NotificationRepository } from './infrastructure/notification.repository';
import { EmailAdapter } from './infrastructure/email.adapter';
import { SmsAdapter } from './infrastructure/sms.adapter';
import { EMAIL_ADAPTER, SMS_ADAPTER } from './infrastructure/notification-adapter.interface';
import { NotificationQueueService } from './application/notification-queue.service';
import { NotificationService } from './application/notification.service';
import { NotificationsController } from './interfaces/notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  providers: [
    NotificationRepository,
    NotificationQueueService,
    { provide: EMAIL_ADAPTER, useClass: EmailAdapter },
    { provide: SMS_ADAPTER, useClass: SmsAdapter },
    NotificationService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationService],
})
export class NotificationsModule {}

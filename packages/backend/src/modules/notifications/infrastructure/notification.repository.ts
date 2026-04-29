import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../domain/notification.entity';
import { TenantScopedRepository } from '../../../common/repositories/tenant-scoped.repository';

@Injectable()
export class NotificationRepository extends TenantScopedRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repo: Repository<Notification>,
  ) {
    super(repo);
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date,
  ): Promise<void> {
    await this.repository.update(
      { id },
      { status, sent_at: sentAt ?? null } as Partial<Notification>,
    );
  }
}

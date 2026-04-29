import { Injectable, Logger } from '@nestjs/common';
import { NotificationAdapter, interpolate } from './notification-adapter.interface';

@Injectable()
export class EmailAdapter implements NotificationAdapter {
  private readonly logger = new Logger(EmailAdapter.name);

  async send(to: string, template: string, payload: Record<string, unknown>): Promise<void> {
    const body = interpolate(`[template:${template}]`, payload);
    this.logger.log(`[EMAIL] to=${to} ${body} payload=${JSON.stringify(payload)}`);
  }
}

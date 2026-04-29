import { Injectable, Logger } from '@nestjs/common';
import { NotificationAdapter, interpolate } from './notification-adapter.interface';

@Injectable()
export class SmsAdapter implements NotificationAdapter {
  private readonly logger = new Logger(SmsAdapter.name);

  async send(to: string, template: string, payload: Record<string, unknown>): Promise<void> {
    const body = interpolate(`[template:${template}]`, payload);
    this.logger.log(`[SMS] to=${to} ${body} payload=${JSON.stringify(payload)}`);
  }
}

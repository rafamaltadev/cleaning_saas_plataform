import { Injectable } from '@nestjs/common';

@Injectable()
export class DomainEventBus {
  emit(event: string, payload: Record<string, unknown>): void {
    void event;
    void payload;
  }
}

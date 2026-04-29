import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DomainEventMap, DomainEventName } from './domain-events.types';

@Injectable()
export class DomainEventBus implements OnModuleDestroy {
  private readonly emitter = new EventEmitter();

  emit<E extends DomainEventName>(event: E, payload: DomainEventMap[E]): void {
    this.emitter.emit(event, payload);
  }

  on<E extends DomainEventName>(
    event: E,
    listener: (payload: DomainEventMap[E]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, listener);
  }

  off<E extends DomainEventName>(
    event: E,
    listener: (payload: DomainEventMap[E]) => void | Promise<void>,
  ): void {
    this.emitter.off(event, listener);
  }

  onModuleDestroy(): void {
    this.emitter.removeAllListeners();
  }
}

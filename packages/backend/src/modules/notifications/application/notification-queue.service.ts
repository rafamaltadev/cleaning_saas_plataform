import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationQueueService {
  private readonly queue: Array<() => Promise<void>> = [];
  private processing = false;

  enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    void this.process();
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task().catch(() => {});
    }
    this.processing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}

import { NotificationQueueService } from './notification-queue.service';

describe('NotificationQueueService', () => {
  let service: NotificationQueueService;

  beforeEach(() => {
    service = new NotificationQueueService();
  });

  it('executes enqueued tasks sequentially', async () => {
    const order: number[] = [];

    service.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push(1);
    });
    service.enqueue(async () => {
      order.push(2);
    });
    service.enqueue(async () => {
      order.push(3);
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(order).toEqual([1, 2, 3]);
  });

  it('continues processing subsequent tasks even if one throws', async () => {
    const results: string[] = [];

    service.enqueue(async () => {
      results.push('first');
    });
    service.enqueue(async () => {
      throw new Error('task error');
    });
    service.enqueue(async () => {
      results.push('third');
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(results).toEqual(['first', 'third']);
  });

  it('pendingCount returns number of tasks waiting', () => {
    let resolve!: () => void;
    service.enqueue(() => new Promise<void>((r) => { resolve = r; }));
    service.enqueue(async () => {});

    expect(service.pendingCount).toBe(1);
    resolve();
  });
});

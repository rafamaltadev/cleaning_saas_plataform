import { AppThrottlerGuard } from './app-throttler.guard';
import { Request } from 'express';
import { AuthUser } from '../interfaces/auth-user.interface';

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;

  beforeEach(() => {
    guard = new AppThrottlerGuard({} as any, {} as any, {} as any);
  });

  describe('getTracker()', () => {
    it('returns user ID when request has an authenticated user', async () => {
      const req = {
        user: { userId: 'user-uuid', tenantId: 'tenant-uuid', roles: ['supervisor'] },
        ip: '127.0.0.1',
      } as Request & { user?: AuthUser };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('user-uuid');
    });

    it('returns IP when request has no authenticated user', async () => {
      const req = {
        user: undefined,
        ip: '192.168.1.100',
      } as Request & { user?: AuthUser };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('192.168.1.100');
    });
  });
});

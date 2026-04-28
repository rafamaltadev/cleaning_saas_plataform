import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function mockContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('returns true when req.user is set', () => {
    const ctx = mockContext({ userId: 'u', tenantId: 't', roles: ['admin'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when req.user is undefined', () => {
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when req.user is null', () => {
    const ctx = mockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

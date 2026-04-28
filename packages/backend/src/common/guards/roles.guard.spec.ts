import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function mockContext(user: unknown, requiredRoles?: string[]): ExecutionContext {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);
  const ctx = {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { guard, ctx } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  function makeCtx(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('returns true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeCtx({ userId: 'u', tenantId: 't', roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when no roles array is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeCtx({ userId: 'u', tenantId: 't', roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = makeCtx({ userId: 'u', tenantId: 't', roles: ['admin', 'staff'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = makeCtx({ userId: 'u', tenantId: 't', roles: ['staff'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException when user is not authenticated', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = makeCtx(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('uses the ROLES_KEY metadata key', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeCtx({});
    guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });
});

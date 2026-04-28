import { AuthUserMiddleware } from './auth-user.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

const mockJwtService = { verify: jest.fn() } as unknown as JwtService;
const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'),
} as unknown as ConfigService;

function makeReq(authHeader?: string): Request & { user?: unknown } {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  } as unknown as Request & { user?: unknown };
}

describe('AuthUserMiddleware', () => {
  let middleware: AuthUserMiddleware;
  const next = jest.fn();

  beforeEach(() => {
    middleware = new AuthUserMiddleware(mockJwtService, mockConfigService);
    jest.clearAllMocks();
    next.mockClear();
  });

  it('attaches user to req when a valid Bearer token is provided', () => {
    (mockJwtService.verify as jest.Mock).mockReturnValue({
      sub: 'user-id',
      tenantId: 'tenant-id',
      roles: ['admin'],
    });

    const req = makeReq('Bearer valid-token');
    middleware.use(req as Request, {} as Response, next);

    expect(req.user).toEqual({
      userId: 'user-id',
      tenantId: 'tenant-id',
      roles: ['admin'],
    });
    expect(next).toHaveBeenCalled();
  });

  it('does not attach user when no Authorization header is present', () => {
    const req = makeReq();
    middleware.use(req as Request, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('does not attach user when Authorization header is not Bearer', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    middleware.use(req as Request, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('does not attach user when JWT verification fails', () => {
    (mockJwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = makeReq('Bearer bad-token');
    middleware.use(req as Request, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('uses empty array for roles when payload has no roles field', () => {
    (mockJwtService.verify as jest.Mock).mockReturnValue({
      sub: 'user-id',
      tenantId: 'tenant-id',
    });

    const req = makeReq('Bearer valid-token');
    middleware.use(req as Request, {} as Response, next);

    expect((req.user as any).roles).toEqual([]);
  });
});

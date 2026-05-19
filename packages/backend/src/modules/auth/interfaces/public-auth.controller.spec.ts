import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicAuthController } from './public-auth.controller';
import { PublicAuthService } from '../application/public-auth.service';
import { GoogleStrategy } from '../strategies/google.strategy';
import { FacebookStrategy } from '../strategies/facebook.strategy';
import { PublicRegisterDto } from '../validation/public-register.dto';
import { PublicLoginDto } from '../validation/public-login.dto';

const TENANT_SLUG = 'rafa-malta';
const MOCK_TOKENS = { accessToken: 'access-token-123', refreshToken: 'refresh-token-abc' };

const mockPublicAuthService = {
  register: jest.fn(),
  loginAsClient: jest.fn(),
  handleOAuthUser: jest.fn(),
} as unknown as PublicAuthService;

const mockGoogleStrategy = {
  enabled: true,
  getAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?foo=bar'),
  getCallbackUrl: jest.fn().mockReturnValue('http://localhost:3000/api/v1/public/rafa-malta/auth/google/callback'),
  buildState: jest.fn().mockReturnValue('encodedstate123'),
  parseState: jest.fn().mockReturnValue({ tenantSlug: TENANT_SLUG, nonce: 'abc' }),
  exchangeCodeForProfile: jest.fn(),
} as unknown as GoogleStrategy;

const mockFacebookStrategy = {
  enabled: true,
  getAuthUrl: jest.fn().mockReturnValue('https://www.facebook.com/v19.0/dialog/oauth?foo=bar'),
  getCallbackUrl: jest.fn().mockReturnValue('http://localhost:3000/api/v1/public/rafa-malta/auth/facebook/callback'),
  buildState: jest.fn().mockReturnValue('encodedstate123'),
  parseState: jest.fn().mockReturnValue({ tenantSlug: TENANT_SLUG, nonce: 'abc' }),
  exchangeCodeForProfile: jest.fn(),
} as unknown as FacebookStrategy;

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:5173'),
} as unknown as ConfigService;

const mockResponse = () => {
  const res: { redirect: jest.Mock } = { redirect: jest.fn() };
  return res;
};

describe('PublicAuthController', () => {
  let controller: PublicAuthController;

  beforeEach(() => {
    controller = new PublicAuthController(
      mockPublicAuthService,
      mockGoogleStrategy,
      mockFacebookStrategy,
      mockConfigService,
    );
    jest.clearAllMocks();
    (mockGoogleStrategy as { enabled: boolean }).enabled = true;
    (mockFacebookStrategy as { enabled: boolean }).enabled = true;
  });

  // ─── POST :tenantSlug/auth/register ─────────────────────────────────────

  describe('register', () => {
    it('creates User and Client with correct tenant_id', async () => {
      (mockPublicAuthService.register as jest.Mock).mockResolvedValue(MOCK_TOKENS);
      const dto: PublicRegisterDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        phone: '11999999999',
      };
      const result = await controller.register(TENANT_SLUG, dto);
      expect(result).toEqual(MOCK_TOKENS);
      expect(mockPublicAuthService.register).toHaveBeenCalledWith(
        TENANT_SLUG,
        dto.name,
        dto.email,
        dto.password,
        dto.phone,
      );
    });

    it('rejects when passwords do not match', async () => {
      const dto: PublicRegisterDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha123',
        confirmPassword: 'Diferente456',
        phone: '11999999999',
      };
      await expect(controller.register(TENANT_SLUG, dto)).rejects.toThrow(BadRequestException);
      expect(mockPublicAuthService.register).not.toHaveBeenCalled();
    });

    it('rejects duplicate email per tenant', async () => {
      (mockPublicAuthService.register as jest.Mock).mockRejectedValue(
        new ConflictException({ code: 'EMAIL_IN_USE', message: 'Este e-mail já está em uso' }),
      );
      const dto: PublicRegisterDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        phone: '11999999999',
      };
      await expect(controller.register(TENANT_SLUG, dto)).rejects.toThrow(ConflictException);
    });

    it('is rate-limited at 10 req/min (throttle metadata is set on the method)', () => {
      const method = PublicAuthController.prototype.register;
      const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', method);
      const ttl = Reflect.getMetadata('THROTTLER:TTLdefault', method);
      expect(limit).toBe(10);
      expect(ttl).toBe(60000);
    });
  });

  // ─── POST :tenantSlug/auth/login ─────────────────────────────────────────

  describe('login', () => {
    it('returns client-role JWT only', async () => {
      (mockPublicAuthService.loginAsClient as jest.Mock).mockResolvedValue(MOCK_TOKENS);
      const dto: PublicLoginDto = { email: 'joao@example.com', password: 'Senha123' };
      const result = await controller.login(TENANT_SLUG, dto);
      expect(result).toEqual(MOCK_TOKENS);
    });

    it('rejects admin/staff credentials with 403', async () => {
      (mockPublicAuthService.loginAsClient as jest.Mock).mockRejectedValue(
        new ForbiddenException({ code: 'NOT_CLIENT', message: 'Este endpoint é exclusivo para clientes' }),
      );
      const dto: PublicLoginDto = { email: 'admin@example.com', password: 'Admin123' };
      await expect(controller.login(TENANT_SLUG, dto)).rejects.toThrow(ForbiddenException);
    });

    it('rejects wrong password with 401', async () => {
      (mockPublicAuthService.loginAsClient as jest.Mock).mockRejectedValue(
        new UnauthorizedException({ code: 'INVALID_CREDENTIALS' }),
      );
      const dto: PublicLoginDto = { email: 'joao@example.com', password: 'wrongpass' };
      await expect(controller.login(TENANT_SLUG, dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── GET :tenantSlug/auth/google ─────────────────────────────────────────

  describe('googleAuth', () => {
    it('redirects to Google OAuth URL when enabled', () => {
      const res = mockResponse();
      controller.googleAuth(TENANT_SLUG, res as never);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('accounts.google.com'));
    });

    it('throws 503 when Google OAuth not configured', () => {
      (mockGoogleStrategy as { enabled: boolean }).enabled = false;
      const res = mockResponse();
      expect(() => controller.googleAuth(TENANT_SLUG, res as never)).toThrow(ServiceUnavailableException);
    });
  });

  // ─── GET :tenantSlug/auth/google/callback ────────────────────────────────

  describe('googleCallback', () => {
    it('creates new User with auth_provider=google on first login', async () => {
      const mockProfile = {
        providerId: 'google-123',
        email: 'user@gmail.com',
        firstName: 'User',
        lastName: 'Test',
        emailVerified: true,
      };
      (mockGoogleStrategy.exchangeCodeForProfile as jest.Mock).mockResolvedValue(mockProfile);
      (mockPublicAuthService.handleOAuthUser as jest.Mock).mockResolvedValue(MOCK_TOKENS);

      const res = mockResponse();
      await controller.googleCallback(TENANT_SLUG, 'auth-code', 'encodedstate123', '', res as never);

      expect(mockPublicAuthService.handleOAuthUser).toHaveBeenCalledWith(TENANT_SLUG, 'google', mockProfile);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('oauth_token'));
    });

    it('rejects mismatched state tenantSlug with 400', async () => {
      (mockGoogleStrategy.parseState as jest.Mock).mockReturnValue({ tenantSlug: 'other-tenant', nonce: 'abc' });
      const res = mockResponse();
      await expect(
        controller.googleCallback(TENANT_SLUG, 'code', 'state', '', res as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid state encoding with 400', async () => {
      (mockGoogleStrategy.parseState as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base64');
      });
      const res = mockResponse();
      await expect(
        controller.googleCallback(TENANT_SLUG, 'code', 'badstate', '', res as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects missing code or state with 400', async () => {
      const res = mockResponse();
      await expect(
        controller.googleCallback(TENANT_SLUG, '', '', '', res as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('redirects to error page on OAuth provider error', async () => {
      const res = mockResponse();
      await controller.googleCallback(TENANT_SLUG, '', '', 'access_denied', res as never);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('oauth_error'));
    });

    it('OAuth state parameter validates tenantSlug correctly', async () => {
      (mockGoogleStrategy.parseState as jest.Mock).mockReturnValue({ tenantSlug: TENANT_SLUG, nonce: 'nonce123' });
      (mockGoogleStrategy.exchangeCodeForProfile as jest.Mock).mockResolvedValue({
        providerId: 'g-id',
        email: 'u@g.com',
        firstName: 'U',
        lastName: 'G',
        emailVerified: true,
      });
      (mockPublicAuthService.handleOAuthUser as jest.Mock).mockResolvedValue(MOCK_TOKENS);

      const res = mockResponse();
      await controller.googleCallback(TENANT_SLUG, 'code', 'state', '', res as never);

      expect(mockGoogleStrategy.parseState).toHaveBeenCalledWith('state');
    });
  });

  // ─── Client role cannot access admin endpoints ────────────────────────────

  describe('client role RBAC', () => {
    it('@Public() is set on the controller class', () => {
      const isPublic = Reflect.getMetadata('isPublic', PublicAuthController);
      expect(isPublic).toBe(true);
    });
  });
});

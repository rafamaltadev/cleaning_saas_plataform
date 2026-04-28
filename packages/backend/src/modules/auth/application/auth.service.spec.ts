import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../domain/user.entity';
import { RefreshToken } from '../domain/refresh-token.entity';

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockRefreshTokenRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.accessExpiration': '15m',
      'jwt.refreshExpiration': '30d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login()', () => {
    const mockUser: User = {
      id: 'user-uuid',
      tenant_id: 'tenant-uuid',
      email: 'test@example.com',
      password_hash: '$2b$12$hashedpassword',
      roles: ['admin'],
      first_name: 'Test',
      last_name: 'User',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    it('returns accessToken and refreshToken for valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed-refresh' as never));
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.login('test@example.com', 'password');

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });

    it('returns 401 when password does not match bcrypt hash', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns 401 when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login('notfound@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('access token payload contains tenant_id, userId, and roles', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      mockJwtService.sign.mockReturnValue('some-token');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed' as never));
      mockRefreshTokenRepository.save.mockResolvedValue({});

      await service.login('test@example.com', 'password');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockUser.tenant_id,
          roles: mockUser.roles,
        }),
        expect.objectContaining({ secret: 'test-secret', expiresIn: '15m' }),
      );
    });

    it('access token has a 15-minute expiry claim', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      mockJwtService.sign.mockReturnValue('some-token');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed' as never));
      mockRefreshTokenRepository.save.mockResolvedValue({});

      await service.login('test@example.com', 'password');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: '15m' }),
      );
    });
  });

  describe('refresh()', () => {
    const activeRecord: RefreshToken = {
      id: 'token-uuid',
      tenant_id: 'tenant-uuid',
      user_id: 'user-uuid',
      token_hash: '$2b$12$hashedtoken',
      expires_at: new Date(Date.now() + 86400000),
      revoked_at: null,
      created_at: new Date(),
    };

    const mockUser: User = {
      id: 'user-uuid',
      tenant_id: 'tenant-uuid',
      email: 'test@example.com',
      password_hash: '$2b$12$hashedpassword',
      roles: ['admin'],
      first_name: 'Test',
      last_name: 'User',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    it('invalidates the old token and returns a new token pair', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(activeRecord);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      mockRefreshTokenRepository.update.mockResolvedValue({});
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('new-access').mockReturnValueOnce('new-refresh');
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed-new' as never));
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.refresh('old-refresh-token');

      expect(result).toHaveProperty('accessToken', 'new-access');
      expect(result).toHaveProperty('refreshToken', 'new-refresh');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { id: activeRecord.id },
        { revoked_at: expect.any(Date) },
      );
    });

    it('revokes all sessions and returns 401 when a revoked token is reused', async () => {
      const revokedRecord = { ...activeRecord, revoked_at: new Date(Date.now() - 1000) };
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(revokedRecord);
      mockRefreshTokenRepository.update.mockResolvedValue({});

      await expect(service.refresh('revoked-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { user_id: revokedRecord.user_id, revoked_at: expect.anything() },
        { revoked_at: expect.any(Date) },
      );
    });

    it('returns 401 when the JWT signature is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid signature'); });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns 401 when the token record is not found in the database', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'unknown-jti' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('valid-jwt-unknown-record')).rejects.toThrow(UnauthorizedException);
    });

    it('returns 401 when the refresh token has expired', async () => {
      const expiredRecord: RefreshToken = {
        id: 'token-uuid',
        tenant_id: 'tenant-uuid',
        user_id: 'user-uuid',
        token_hash: '$2b$12$hash',
        expires_at: new Date(Date.now() - 1000),
        revoked_at: null,
        created_at: new Date(),
      };
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(expiredRecord);

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns 401 when bcrypt comparison fails despite valid JWT', async () => {
      const activeRecord: RefreshToken = {
        id: 'token-uuid',
        tenant_id: 'tenant-uuid',
        user_id: 'user-uuid',
        token_hash: '$2b$12$differenthash',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        created_at: new Date(),
      };
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(activeRecord);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

      await expect(service.refresh('tampered-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns 401 when user is not found after token rotation', async () => {
      const activeRecord: RefreshToken = {
        id: 'token-uuid',
        tenant_id: 'tenant-uuid',
        user_id: 'user-uuid',
        token_hash: '$2b$12$hash',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        created_at: new Date(),
      };
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(activeRecord);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      mockRefreshTokenRepository.update.mockResolvedValue({});
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('invalidates only the provided refresh token, leaving other sessions active', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid', tenantId: 'tenant-uuid', jti: 'token-uuid' });
      mockRefreshTokenRepository.update.mockResolvedValue({});

      await service.logout('valid-refresh-token');

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { id: 'token-uuid', revoked_at: expect.anything() },
        { revoked_at: expect.any(Date) },
      );
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledTimes(1);
    });

    it('does nothing when an invalid refresh token is provided', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(service.logout('bad-token')).resolves.toBeUndefined();
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
    });
  });
});

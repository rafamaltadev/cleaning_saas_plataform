import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../domain/user.entity';
import { RefreshToken } from '../domain/refresh-token.entity';
import { JwtPayload, RefreshTokenPayload } from '../domain/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email, deleted_at: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    return this.issueTokenPairPublic(user);
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
      });
    }

    const record = await this.refreshTokenRepository.findOne({
      where: { id: payload.jti },
    });

    if (!record) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
      });
    }

    if (record.revoked_at) {
      await this.refreshTokenRepository.update(
        { user_id: record.user_id, revoked_at: IsNull() },
        { revoked_at: new Date() },
      );
      throw new UnauthorizedException({
        code: 'TOKEN_REUSE',
        message: 'Token reuse detected — all sessions revoked',
      });
    }

    if (record.expires_at < new Date()) {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Refresh token expired',
      });
    }

    const valid = await bcrypt.compare(rawRefreshToken, record.token_hash);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
      });
    }

    await this.refreshTokenRepository.update(
      { id: record.id },
      { revoked_at: new Date() },
    );

    const user = await this.userRepository.findOne({
      where: { id: record.user_id },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return this.issueTokenPairPublic(user);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      return;
    }

    await this.refreshTokenRepository.update(
      { id: payload.jti, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  async issueTokenPairPublicClient(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.issueTokenPairPublic(
      user,
      this.configService.get<string>('jwt.publicClientAccessExpiration') ?? '60m',
    );
  }

  async issueTokenPairPublic(
    user: User,
    accessExpiresIn?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenant_id,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn:
        accessExpiresIn ??
        this.configService.get<string>('jwt.accessExpiration') ??
        '15m',
    });

    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + this.getRefreshExpiryMs(),
    );

    const rawRefreshToken = this.jwtService.sign(
      { sub: user.id, tenantId: user.tenant_id, jti: tokenId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn:
          this.configService.get<string>('jwt.refreshExpiration') ?? '30d',
      },
    );

    const tokenHash = await bcrypt.hash(rawRefreshToken, 12);

    await this.refreshTokenRepository.save({
      id: tokenId,
      tenant_id: user.tenant_id,
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private getRefreshExpiryMs(): number {
    const expiry =
      this.configService.get<string>('jwt.refreshExpiration') ?? '30d';
    const days = parseInt(expiry.replace('d', ''), 10);
    return days * 24 * 60 * 60 * 1000;
  }
}

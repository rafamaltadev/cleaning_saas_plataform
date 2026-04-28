import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../modules/auth/domain/jwt-payload.interface';

@Injectable()
export class AuthUserMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: this.configService.get<string>('jwt.secret'),
        });
        req.user = {
          userId: payload.sub,
          tenantId: payload.tenantId,
          roles: payload.roles ?? [],
        };
      } catch {
        // invalid token — leave req.user unset, guard will reject if needed
      }
    }
    next();
  }
}

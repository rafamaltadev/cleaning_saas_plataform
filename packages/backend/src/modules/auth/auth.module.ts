import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './domain/user.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { Client } from '../clients/domain/client.entity';
import { Tenant } from '../tenant/domain/tenant.entity';
import { AuthService } from './application/auth.service';
import { PublicAuthService } from './application/public-auth.service';
import { AuthController } from './interfaces/auth.controller';
import { PublicAuthController } from './interfaces/public-auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserMiddleware } from '../../common/middleware/auth-user.middleware';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Client, Tenant]),
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    PublicAuthService,
    JwtAuthGuard,
    RolesGuard,
    AuthUserMiddleware,
    GoogleStrategy,
    FacebookStrategy,
  ],
  controllers: [AuthController, PublicAuthController],
  exports: [JwtAuthGuard, RolesGuard, AuthService, JwtModule, AuthUserMiddleware],
})
export class AuthModule {}

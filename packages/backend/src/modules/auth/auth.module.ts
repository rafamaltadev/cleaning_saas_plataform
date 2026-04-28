import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './domain/user.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { AuthService } from './application/auth.service';
import { AuthController } from './interfaces/auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUserMiddleware } from '../../common/middleware/auth-user.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({}),
  ],
  providers: [AuthService, JwtAuthGuard, RolesGuard, AuthUserMiddleware],
  controllers: [AuthController],
  exports: [JwtAuthGuard, RolesGuard, AuthService, JwtModule, AuthUserMiddleware],
})
export class AuthModule {}

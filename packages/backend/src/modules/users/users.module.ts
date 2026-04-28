import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/domain/user.entity';
import { UserRepository } from './infrastructure/user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './interfaces/users.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditLogModule, AuthModule],
  providers: [UserRepository, UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

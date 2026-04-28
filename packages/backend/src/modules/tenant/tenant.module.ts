import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './domain/tenant.entity';
import { TenantRepository } from './infrastructure/tenant.repository';
import { TenantService } from './application/tenant.service';
import { TenantController } from './interfaces/tenant.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), AuthModule],
  providers: [TenantRepository, TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}

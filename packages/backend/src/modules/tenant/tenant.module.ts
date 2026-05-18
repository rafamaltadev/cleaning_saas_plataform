import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './domain/tenant.entity';
import { TenantRepository } from './infrastructure/tenant.repository';
import { TenantService } from './application/tenant.service';
import { BrandingService } from './application/branding.service';
import { TenantController } from './interfaces/tenant.controller';
import { BrandingPublicController } from './interfaces/branding-public.controller';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), AuthModule, StorageModule],
  providers: [TenantRepository, TenantService, BrandingService],
  controllers: [TenantController, BrandingPublicController],
  exports: [TenantService],
})
export class TenantModule {}

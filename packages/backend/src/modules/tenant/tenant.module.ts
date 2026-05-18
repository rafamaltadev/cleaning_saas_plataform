import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './domain/tenant.entity';
import { TenantRepository } from './infrastructure/tenant.repository';
import { TenantService } from './application/tenant.service';
import { BrandingService } from './application/branding.service';
import { PublicTenantService } from './application/public-tenant.service';
import { TenantController } from './interfaces/tenant.controller';
import { BrandingPublicController } from './interfaces/branding-public.controller';
import { PublicTenantController } from './interfaces/public-tenant.controller';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../common/storage/storage.module';
import { Service } from '../services/domain/service.entity';
import { ServiceCategory } from '../services/domain/service-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Service, ServiceCategory]),
    AuthModule,
    StorageModule,
  ],
  providers: [TenantRepository, TenantService, BrandingService, PublicTenantService],
  controllers: [TenantController, BrandingPublicController, PublicTenantController],
  exports: [TenantService],
})
export class TenantModule {}

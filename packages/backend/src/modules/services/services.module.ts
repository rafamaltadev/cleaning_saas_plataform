import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './domain/service.entity';
import { PricingRule } from './domain/pricing-rule.entity';
import { ServiceCategory } from './domain/service-category.entity';
import { ServiceAddon } from './domain/service-addon.entity';
import { ServiceRepository } from './infrastructure/service.repository';
import { PricingRuleRepository } from './infrastructure/pricing-rule.repository';
import { ServiceCategoryRepository } from './infrastructure/service-category.repository';
import { ServiceAddonRepository } from './infrastructure/service-addon.repository';
import { PricingService } from './application/pricing.service';
import { ServicesService } from './application/services.service';
import { PricingRulesService } from './application/pricing-rules.service';
import { ServiceCategoriesService } from './application/service-categories.service';
import { ServiceAddonsService } from './application/service-addons.service';
import { ServicesController } from './interfaces/services.controller';
import { PricingRulesController } from './interfaces/pricing-rules.controller';
import { ServiceCategoriesController } from './interfaces/service-categories.controller';
import { ServiceAddonsController } from './interfaces/service-addons.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, PricingRule, ServiceCategory, ServiceAddon]),
    AuthModule,
  ],
  providers: [
    ServiceRepository,
    PricingRuleRepository,
    ServiceCategoryRepository,
    ServiceAddonRepository,
    PricingService,
    ServicesService,
    PricingRulesService,
    ServiceCategoriesService,
    ServiceAddonsService,
  ],
  controllers: [
    ServicesController,
    PricingRulesController,
    ServiceCategoriesController,
    ServiceAddonsController,
  ],
  exports: [
    PricingService,
    ServiceRepository,
    PricingRuleRepository,
    ServiceCategoryRepository,
    ServiceAddonRepository,
  ],
})
export class ServicesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './domain/service.entity';
import { PricingRule } from './domain/pricing-rule.entity';
import { ServiceRepository } from './infrastructure/service.repository';
import { PricingRuleRepository } from './infrastructure/pricing-rule.repository';
import { PricingService } from './application/pricing.service';
import { ServicesService } from './application/services.service';
import { PricingRulesService } from './application/pricing-rules.service';
import { ServicesController } from './interfaces/services.controller';
import { PricingRulesController } from './interfaces/pricing-rules.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, PricingRule]), AuthModule],
  providers: [
    ServiceRepository,
    PricingRuleRepository,
    PricingService,
    ServicesService,
    PricingRulesService,
  ],
  controllers: [ServicesController, PricingRulesController],
  exports: [PricingService, ServiceRepository, PricingRuleRepository],
})
export class ServicesModule {}

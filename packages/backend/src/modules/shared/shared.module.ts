import { Global, Module } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';

@Global()
@Module({
  providers: [FeatureFlagService, DomainEventBus],
  exports: [FeatureFlagService, DomainEventBus],
})
export class SharedModule {}

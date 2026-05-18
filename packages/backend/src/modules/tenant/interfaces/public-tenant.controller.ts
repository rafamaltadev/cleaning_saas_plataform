import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicTenantService } from '../application/public-tenant.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('public')
@Controller('v1/public')
@Public()
export class PublicTenantController {
  constructor(private readonly publicTenantService: PublicTenantService) {}

  @Get(':tenantSlug/profile')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get public profile for a tenant' })
  @ApiResponse({ status: 200, description: 'Returns tenant public profile' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getProfile(@Param('tenantSlug') tenantSlug: string) {
    const profile = await this.publicTenantService.getProfileBySlug(tenantSlug);
    if (!profile) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }
    return profile;
  }

  @Get(':tenantSlug/services')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get public services for a tenant' })
  @ApiResponse({ status: 200, description: 'Returns tenant active services' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getServices(@Param('tenantSlug') tenantSlug: string) {
    const services = await this.publicTenantService.getServicesBySlug(tenantSlug);
    if (!services) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }
    return services;
  }
}

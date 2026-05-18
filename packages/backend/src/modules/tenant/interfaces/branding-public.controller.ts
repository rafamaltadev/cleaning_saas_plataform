import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrandingService } from '../application/branding.service';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('public')
@Controller('v1/public')
@Public()
export class BrandingPublicController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get(':tenantSlug/branding')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get public branding for a tenant' })
  @ApiResponse({ status: 200, description: 'Returns tenant branding' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getBranding(@Param('tenantSlug') tenantSlug: string) {
    const branding = await this.brandingService.getBrandingBySlug(tenantSlug);
    if (!branding) {
      throw new NotFoundException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }
    return branding;
  }
}

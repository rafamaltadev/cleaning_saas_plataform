import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PublicQuoteService } from '../application/public-quote.service';
import { QuoteEstimateDto } from '../validation/quote-estimate.dto';

@ApiTags('public')
@Controller('v1/public')
@Public()
export class PublicQuoteController {
  constructor(private readonly publicQuoteService: PublicQuoteService) {}

  @Post(':tenantSlug/quote-estimate')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Compute a public quote estimate without authentication' })
  async estimateQuote(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: QuoteEstimateDto,
  ) {
    return this.publicQuoteService.estimateQuote(tenantSlug, dto);
  }

  @Get(':tenantSlug/services/:serviceId/addons')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get addons for a service (public quote form)' })
  async getServiceAddons(
    @Param('tenantSlug') tenantSlug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicQuoteService.getServiceAddons(tenantSlug, serviceId);
  }
}

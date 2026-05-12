import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuoteAddonsService } from '../application/quote-addons.service';
import { QuoteAddonResponseDto } from '../domain/quote-addon-response.dto';
import { SyncQuoteAddonsDto } from '../validation/sync-quote-addons.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('quote-addons')
@ApiBearerAuth()
@Controller('v1/quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class QuoteAddonsController {
  constructor(private readonly quoteAddonsService: QuoteAddonsService) {}

  @Get(':quoteId/addons')
  @ApiOperation({ summary: 'Get addons for a quote' })
  @ApiResponse({ status: 200, type: [QuoteAddonResponseDto] })
  findByQuoteId(
    @Req() req: Request & { user?: AuthUser },
    @Param('quoteId') quoteId: string,
  ): Promise<QuoteAddonResponseDto[]> {
    return this.quoteAddonsService.findByQuoteId(req.user!.tenantId, quoteId);
  }

  @Post(':quoteId/addons/sync')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sync addons for a quote (replaces all existing addons)' })
  @ApiResponse({ status: 200, description: 'Addons synced' })
  syncAddons(
    @Req() req: Request & { user?: AuthUser },
    @Param('quoteId') quoteId: string,
    @Body() dto: SyncQuoteAddonsDto,
  ): Promise<void> {
    return this.quoteAddonsService.syncAddons(req.user!.tenantId, quoteId, dto.addons);
  }
}

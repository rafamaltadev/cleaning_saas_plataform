import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PricingRulesService } from '../application/pricing-rules.service';
import { CreatePricingRuleDto } from '../domain/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from '../domain/update-pricing-rule.dto';
import { PricingRuleResponseDto } from '../domain/pricing-rule-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('pricing-rules')
@ApiBearerAuth()
@Controller('v1/pricing-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class PricingRulesController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List pricing rules' })
  @ApiResponse({ status: 200, description: 'Paginated pricing rule list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<PricingRuleResponseDto>> {
    return this.pricingRulesService.findAll(req.user!.tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a pricing rule' })
  @ApiResponse({ status: 201, type: PricingRuleResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    return this.pricingRulesService.create(req.user!.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a pricing rule' })
  @ApiResponse({ status: 200, type: PricingRuleResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    return this.pricingRulesService.update(req.user!.tenantId, id, dto);
  }
}

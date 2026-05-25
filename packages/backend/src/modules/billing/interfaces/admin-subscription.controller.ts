import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SubscriptionPlanService } from '../subscriptions/subscription-plan.service';
import { TenantSubscriptionService } from '../subscriptions/tenant-subscription.service';
import { CreateSubscriptionPlanDto } from '../validation/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../validation/update-subscription-plan.dto';

@ApiTags('admin-subscriptions')
@ApiBearerAuth()
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('platform_admin')
export class AdminSubscriptionController {
  constructor(
    private readonly planService: SubscriptionPlanService,
    private readonly subscriptionService: TenantSubscriptionService,
  ) {}

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List all subscription plans (admin)' })
  listPlans() {
    return this.planService.findAllPlans();
  }

  @Post('subscription-plans')
  @ApiOperation({ summary: 'Create subscription plan (admin)' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.planService.createPlan(dto);
  }

  @Put('subscription-plans/:id')
  @ApiOperation({ summary: 'Update subscription plan (admin)' })
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.planService.updatePlan(id, dto);
  }

  @Delete('subscription-plans/:id')
  @ApiOperation({ summary: 'Soft delete subscription plan (admin)' })
  deletePlan(@Param('id') id: string) {
    return this.planService.deletePlan(id);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all tenant subscriptions (admin)' })
  listSubscriptions(
    @Query('status') status?: string,
    @Query('tenant_id') tenantId?: string,
    @Query('plan_id') planId?: string,
  ) {
    return this.subscriptionService.getAllSubscriptions({ status, tenantId, planId });
  }
}

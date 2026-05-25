import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { SubscriptionPlanService } from '../subscriptions/subscription-plan.service';
import { TenantSubscriptionService } from '../subscriptions/tenant-subscription.service';
import { CreateCheckoutSessionDto } from '../validation/create-checkout-session.dto';
import { CancelSubscriptionDto } from '../validation/cancel-subscription.dto';
import { UpdateTenantSubscriptionDto } from '../validation/update-tenant-subscription.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('v1/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin')
export class BillingController {
  constructor(
    private readonly planService: SubscriptionPlanService,
    private readonly subscriptionService: TenantSubscriptionService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'List active subscription plans' })
  getPlans(@Req() req: Request & { user?: AuthUser }) {
    return this.planService.findActivePlans('BRL');
  }

  @Get('subscription/me')
  @ApiOperation({ summary: 'Get current tenant subscription' })
  getMySubscription(@Req() req: Request & { user?: AuthUser }) {
    return this.subscriptionService.getMySubscription(req.user!.tenantId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe Checkout session' })
  createCheckout(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionService.createCheckout(req.user!.tenantId, dto);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Open Stripe Customer Portal' })
  openPortal(
    @Req() req: Request & { user?: AuthUser },
    @Query('return_url') returnUrl: string,
  ) {
    const url = returnUrl ?? `${process.env.FRONTEND_URL}/settings`;
    return this.subscriptionService.openPortal(req.user!.tenantId, url);
  }

  @Post('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancel(req.user!.tenantId, dto);
  }

  @Post('subscription/change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  changePlan(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: UpdateTenantSubscriptionDto,
  ) {
    return this.subscriptionService.changePlan(req.user!.tenantId, dto.plan_id);
  }
}

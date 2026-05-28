import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PublicPaymentService } from './public-payment.service';
import { CreatePaymentIntentDto } from './create-payment-intent.dto';

// Public endpoints — NO class-level @UseGuards, applied per-method only
@ApiTags('public-payments')
@Controller('v1/public')
export class PublicPaymentController {
  constructor(private readonly publicPaymentService: PublicPaymentService) {}

  @Post(':tenantSlug/payments/intent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Create Stripe PaymentIntent for a booking (client JWT required)' })
  async createPaymentIntent(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePaymentIntentDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const userId = req.user!.userId;
    return this.publicPaymentService.createPublicPaymentIntent({
      tenantSlug,
      bookingId: dto.booking_id,
      userId,
    });
  }

  @Get(':tenantSlug/payments/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'List client own payments (client JWT required)' })
  async getMyPayments(
    @Param('tenantSlug') tenantSlug: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const userId = req.user!.userId;
    return this.publicPaymentService.getMyPayments(tenantSlug, userId);
  }
}

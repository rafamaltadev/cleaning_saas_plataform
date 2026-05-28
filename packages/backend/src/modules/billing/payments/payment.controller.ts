import {
  Body,
  Controller,
  Get,
  Param,
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
import { PaymentService } from './payment.service';
import { RefundPaymentDto } from './refund-payment.dto';

@ApiTags('billing-payments')
@ApiBearerAuth()
@Controller('v1/billing/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles('tenant_admin', 'supervisor')
  @ApiOperation({ summary: 'List tenant payments' })
  async listPayments(
    @Req() req: Request & { user?: AuthUser },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user!.tenantId;
    return this.paymentService.listTenantPayments(tenantId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/refund')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Refund a payment (admin only)' })
  async refundPayment(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment({
      paymentId: id,
      tenantId: req.user!.tenantId,
      actorId: req.user!.userId,
      amount: dto.amount,
      reason: dto.reason,
    });
  }

  @Post(':id/send-payment-link')
  @Roles('tenant_admin', 'supervisor')
  @ApiOperation({ summary: 'Resend payment link for postpaid booking' })
  async sendPaymentLink(
    @Param('id') id: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    await this.paymentService.sendPaymentLink(id, req.user!.tenantId, req.user!.userId);
    return { success: true };
  }
}

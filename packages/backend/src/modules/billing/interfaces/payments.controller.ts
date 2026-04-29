import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from '../application/billing.service';
import { CreatePaymentDto } from '../validation/create-payment.dto';
import { PaymentResponseDto } from '../domain/payment-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class PaymentsController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.billingService.createPayment(
      req.user!.tenantId,
      req.user!.userId,
      dto,
    );
  }
}

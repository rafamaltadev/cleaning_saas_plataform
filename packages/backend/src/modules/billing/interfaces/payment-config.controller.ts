import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { UpdatePaymentConfigDto } from '../validation/update-payment-config.dto';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('v1/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentConfigController {
  private readonly logger = new Logger(PaymentConfigController.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Roles('tenant_admin')
  @Put('payment-config')
  @ApiOperation({ summary: 'Update payment mode and timing for tenant' })
  async updatePaymentConfig(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: UpdatePaymentConfigDto,
  ) {
    const user = req.user!;

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const oldValues = {
      payment_mode: tenant.payment_mode,
      payment_timing: tenant.payment_timing,
    };

    await this.dataSource.getRepository(Tenant).update(
      { id: user.tenantId },
      {
        payment_mode: dto.payment_mode,
        payment_timing: dto.payment_timing,
      },
    );

    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: user.tenantId,
      user_id: user.userId,
      action: 'payment_config.updated',
      resource_type: 'tenant',
      resource_id: user.tenantId,
      old_values: oldValues,
      new_values: { payment_mode: dto.payment_mode, payment_timing: dto.payment_timing },
    }).catch((err) => this.logger.error('Audit log failed', err));

    return {
      payment_mode: dto.payment_mode,
      payment_timing: dto.payment_timing,
    };
  }
}

import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TenantService } from '../application/tenant.service';
import { UpdateTenantDto } from '../domain/update-tenant.dto';
import { TenantResponseDto } from '../domain/tenant-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  getMe(
    @Req() req: Request & { user?: AuthUser },
  ): Promise<TenantResponseDto> {
    return this.tenantService.getById(req.user!.tenantId);
  }

  @Put('me')
  updateMe(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(req.user!.tenantId, dto);
  }
}

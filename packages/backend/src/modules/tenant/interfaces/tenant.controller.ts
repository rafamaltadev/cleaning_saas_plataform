import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../application/tenant.service';
import { UpdateTenantDto } from '../domain/update-tenant.dto';
import { TenantResponseDto } from '../domain/tenant-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant profile' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getMe(
    @Req() req: Request & { user?: AuthUser },
  ): Promise<TenantResponseDto> {
    return this.tenantService.getById(req.user!.tenantId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current tenant profile' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateMe(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(req.user!.tenantId, dto);
  }
}

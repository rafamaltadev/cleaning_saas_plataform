import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceAddonsService } from '../application/service-addons.service';
import { CreateServiceAddonDto } from '../domain/create-service-addon.dto';
import { UpdateServiceAddonDto } from '../domain/update-service-addon.dto';
import { ServiceAddonResponseDto } from '../domain/service-addon-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('service-addons')
@ApiBearerAuth()
@Controller('v1/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class ServiceAddonsController {
  constructor(private readonly addonsService: ServiceAddonsService) {}

  @Get(':serviceId/addons')
  @ApiOperation({ summary: 'List addons for a service' })
  @ApiResponse({ status: 200, type: [ServiceAddonResponseDto] })
  getAll(
    @Req() req: Request & { user?: AuthUser },
    @Param('serviceId') serviceId: string,
  ): Promise<ServiceAddonResponseDto[]> {
    return this.addonsService.findByServiceId(serviceId, req.user!.tenantId);
  }

  @Post(':serviceId/addons')
  @ApiOperation({ summary: 'Create an addon for a service' })
  @ApiResponse({ status: 201, type: ServiceAddonResponseDto })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceAddonDto,
  ): Promise<ServiceAddonResponseDto> {
    return this.addonsService.create(serviceId, req.user!.tenantId, dto);
  }

  @Put(':serviceId/addons/:id')
  @ApiOperation({ summary: 'Update a service addon' })
  @ApiResponse({ status: 200, type: ServiceAddonResponseDto })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceAddonDto,
  ): Promise<ServiceAddonResponseDto> {
    return this.addonsService.update(serviceId, req.user!.tenantId, id, dto);
  }

  @Delete(':serviceId/addons/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a service addon' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(
    @Req() req: Request & { user?: AuthUser },
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.addonsService.remove(serviceId, req.user!.tenantId, id);
  }
}

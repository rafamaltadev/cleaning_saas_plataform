import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceCategoriesService } from '../application/service-categories.service';
import { CreateServiceCategoryDto } from '../domain/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../domain/update-service-category.dto';
import { ServiceCategoryResponseDto } from '../domain/service-category-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('service-categories')
@ApiBearerAuth()
@Controller('v1/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List service categories' })
  @ApiResponse({ status: 200, type: [ServiceCategoryResponseDto] })
  getAll(@Req() req: Request & { user?: AuthUser }): Promise<ServiceCategoryResponseDto[]> {
    return this.categoriesService.findAll(req.user!.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a service category' })
  @ApiResponse({ status: 201, type: ServiceCategoryResponseDto })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoriesService.create(req.user!.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service category' })
  @ApiResponse({ status: 200, type: ServiceCategoryResponseDto })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoriesService.update(req.user!.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a service category' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<void> {
    return this.categoriesService.remove(req.user!.tenantId, id);
  }
}

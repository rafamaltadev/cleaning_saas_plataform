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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from '../application/scheduling.service';
import { CreateAvailabilityDto } from '../validation/create-availability.dto';
import { AvailabilityResponseDto } from '../domain/availability-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('availability')
@ApiBearerAuth()
@Controller('v1/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class AvailabilityController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @ApiOperation({ summary: 'List availability slots' })
  @ApiResponse({ status: 200, description: 'Paginated availability list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<AvailabilityResponseDto>> {
    return this.schedulingService.findAll(req.user!.tenantId, query);
  }

  @Post()
  @Roles('staff', 'supervisor', 'tenant_admin')
  @ApiOperation({ summary: 'Create an availability slot' })
  @ApiResponse({ status: 201, type: AvailabilityResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.schedulingService.createAvailability(
      req.user!.tenantId,
      req.user!.userId,
      dto,
    );
  }
}

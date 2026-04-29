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
import { AssignmentService } from '../application/assignment.service';
import { CreateAssignmentDto } from '../validation/create-assignment.dto';
import { AssignmentResponseDto } from '../domain/assignment-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('v1/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class AssignmentsController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  @ApiOperation({ summary: 'List assignments' })
  @ApiResponse({ status: 200, description: 'Paginated assignment list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<AssignmentResponseDto>> {
    return this.assignmentService.findAll(req.user!.tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create an assignment' })
  @ApiResponse({ status: 201, type: AssignmentResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentService.create(req.user!.tenantId, req.user!.userId, dto);
  }
}

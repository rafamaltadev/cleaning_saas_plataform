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
import { AssignmentService } from '../application/assignment.service';
import { CreateAssignmentDto } from '../validation/create-assignment.dto';
import { AssignmentResponseDto } from '../domain/assignment-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class AssignmentsController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<AssignmentResponseDto>> {
    return this.assignmentService.findAll(req.user!.tenantId, query);
  }

  @Post()
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentService.create(req.user!.tenantId, req.user!.userId, dto);
  }
}
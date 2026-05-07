import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from '../application/clients.service';
import { CreateClientDto } from '../domain/create-client.dto';
import { UpdateClientDto } from '../domain/update-client.dto';
import { ClientResponseDto } from '../domain/client-response.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ListClientsQueryDto } from '../domain/list-clients-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('v1/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients' })
  @ApiResponse({ status: 200, description: 'Paginated client list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: ListClientsQueryDto,
  ): Promise<PaginatedResult<ClientResponseDto>> {
    return this.clientsService.findAll(req.user!.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getOne(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<ClientResponseDto> {
    return this.clientsService.findOne(req.user!.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a client' })
  @ApiResponse({ status: 201, type: ClientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<void> {
    return this.clientsService.remove(req.user!.tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(
      req.user!.tenantId,
      req.user!.userId,
      id,
      dto,
    );
  }
}

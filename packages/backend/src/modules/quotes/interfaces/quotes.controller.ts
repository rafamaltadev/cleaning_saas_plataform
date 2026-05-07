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
import { QuoteService } from '../application/quote.service';
import { CreateQuoteDto } from '../validation/create-quote.dto';
import { UpdateQuoteDto } from '../validation/update-quote.dto';
import { QuoteResponseDto } from '../domain/quote-response.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ListQuotesQueryDto } from '../validation/list-quotes-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('quotes')
@ApiBearerAuth()
@Controller('v1/quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class QuotesController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get()
  @ApiOperation({ summary: 'List quotes' })
  @ApiResponse({ status: 200, description: 'Paginated quote list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: ListQuotesQueryDto,
  ): Promise<PaginatedResult<QuoteResponseDto>> {
    return this.quoteService.findAll(req.user!.tenantId, req.user!.userId, query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available quotes for booking (accepted, no active booking)' })
  @ApiResponse({ status: 200, type: [QuoteResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAvailable(
    @Req() req: Request & { user?: AuthUser },
  ): Promise<QuoteResponseDto[]> {
    return this.quoteService.findAvailable(req.user!.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findById(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.findById(id, req.user!.tenantId, req.user!.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a quote' })
  @ApiResponse({ status: 201, type: QuoteResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a quote' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<void> {
    return this.quoteService.remove(id, req.user!.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a quote' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.update(id, req.user!.tenantId, req.user!.userId, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a quote to the client' })
  @ApiResponse({ status: 201, type: QuoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid quote status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  send(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.send(
      id,
      req.user!.tenantId,
      req.user!.userId,
      req.user!.permissions ?? [],
    );
  }
}

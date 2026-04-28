import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { QuoteService } from '../application/quote.service';
import { CreateQuoteDto } from '../validation/create-quote.dto';
import { UpdateQuoteDto } from '../validation/update-quote.dto';
import { QuoteResponseDto } from '../domain/quote-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class QuotesController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get()
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<QuoteResponseDto>> {
    return this.quoteService.findAll(req.user!.tenantId, req.user!.userId, query);
  }

  @Get(':id')
  findById(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.findById(id, req.user!.tenantId, req.user!.userId);
  }

  @Post()
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quoteService.update(id, req.user!.tenantId, req.user!.userId, dto);
  }

  @Post(':id/send')
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

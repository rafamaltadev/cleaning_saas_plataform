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
import { BookingService } from '../application/booking.service';
import { CreateBookingDto } from '../validation/create-booking.dto';
import { UpdateBookingDto } from '../validation/update-booking.dto';
import { BookingResponseDto } from '../domain/booking-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return this.bookingService.findAll(req.user!.tenantId, query);
  }

  @Get(':id')
  findById(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.findById(id, req.user!.tenantId);
  }

  @Post()
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.update(id, req.user!.tenantId, req.user!.userId, dto);
  }

  @Post(':id/complete')
  complete(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.complete(id, req.user!.tenantId, req.user!.userId);
  }
}
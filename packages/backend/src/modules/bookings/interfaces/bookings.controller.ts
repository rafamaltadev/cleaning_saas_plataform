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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from '../application/booking.service';
import { CreateBookingDto } from '../validation/create-booking.dto';
import { UpdateBookingDto } from '../validation/update-booking.dto';
import { BookingResponseDto } from '../domain/booking-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('v1/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings' })
  @ApiResponse({ status: 200, description: 'Paginated booking list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return this.bookingService.findAll(req.user!.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findById(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.findById(id, req.user!.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking from an accepted quote' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid quote status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.update(id, req.user!.tenantId, req.user!.userId, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a booking as completed' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid booking status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  complete(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.complete(id, req.user!.tenantId, req.user!.userId);
  }
}

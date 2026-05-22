import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { AvailabilityService } from '../application/availability.service';
import { PublicBookingService } from '../application/public-booking.service';
import { CreatePublicBookingDto } from '../validation/create-public-booking.dto';
import { GetAvailabilityQueryDto } from '../validation/get-availability-query.dto';

@ApiTags('public-bookings')
@Controller('v1/public')
export class PublicBookingController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly publicBookingService: PublicBookingService,
  ) {}

  @Get(':tenantSlug/availability')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get available time slots for a tenant' })
  async getAvailability(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetAvailabilityQueryDto,
  ) {
    return this.availabilityService.getAvailability(tenantSlug, query.from, query.to);
  }

  @Post(':tenantSlug/bookings')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a public booking (requires client JWT)' })
  async createPublicBooking(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePublicBookingDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const userId = req.user!.userId;
    return this.publicBookingService.createPublicBooking(tenantSlug, userId, dto);
  }

  @Get(':tenantSlug/bookings/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Get my bookings (requires client JWT)' })
  async getMyBookings(
    @Param('tenantSlug') tenantSlug: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const userId = req.user!.userId;
    return this.publicBookingService.getMyBookings(tenantSlug, userId);
  }

  @Get(':tenantSlug/bookings/my/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Get booking count for authenticated client' })
  async getMyBookingsCount(
    @Param('tenantSlug') tenantSlug: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const userId = req.user!.userId;
    const count = await this.publicBookingService.getClientBookingsCount(tenantSlug, userId);
    return { count };
  }
}

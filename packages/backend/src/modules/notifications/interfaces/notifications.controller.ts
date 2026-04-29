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
import { NotificationService } from '../application/notification.service';
import { SendNotificationDto } from '../validation/send-notification.dto';
import { NotificationResponseDto } from '../domain/notification-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    return this.notificationService.findAll(req.user!.tenantId, query);
  }

  @Post('send')
  send(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.send(req.user!.tenantId, {
      type: dto.type,
      template: dto.template,
      to: dto.to,
      payload: dto.payload,
      clientId: dto.client_id,
      bookingId: dto.booking_id,
      quoteId: dto.quote_id,
    });
  }
}

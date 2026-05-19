import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PublicQuoteSubmissionService } from '../application/public-quote-submission.service';
import { CreatePublicQuoteDto } from '../validation/create-public-quote.dto';

@ApiTags('public-quotes')
@Controller('v1/public')
export class PublicQuoteSubmissionController {
  constructor(private readonly submissionService: PublicQuoteSubmissionService) {}

  @Post(':tenantSlug/quotes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a public quote (requires client JWT)' })
  async createPublicQuote(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePublicQuoteDto,
    @Req() req: Request & { user?: AuthUser },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const userId = req.user!.userId;
    return this.submissionService.createPublicQuote(tenantSlug, userId, dto, ip, userAgent);
  }
}

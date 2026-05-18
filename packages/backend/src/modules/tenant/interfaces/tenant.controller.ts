import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { TenantService } from '../application/tenant.service';
import { UpdateTenantDto } from '../domain/update-tenant.dto';
import { TenantResponseDto } from '../domain/tenant-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

interface UploadedFileShape {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant profile' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getMe(
    @Req() req: Request & { user?: AuthUser },
  ): Promise<TenantResponseDto> {
    return this.tenantService.getById(req.user!.tenantId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current tenant profile' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateMe(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(req.user!.tenantId, dto);
  }

  @Post('me/logo')
  @ApiOperation({ summary: 'Upload tenant logo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Returns logo_url' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadLogo(
    @Req() req: Request & { user?: AuthUser },
    @UploadedFile() file: UploadedFileShape,
  ): Promise<{ logo_url: string }> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'file field is required' });
    }
    return this.tenantService.uploadLogo(req.user!.tenantId, file);
  }

  @Post('me/favicon')
  @ApiOperation({ summary: 'Upload tenant favicon' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Returns favicon_url' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadFavicon(
    @Req() req: Request & { user?: AuthUser },
    @UploadedFile() file: UploadedFileShape,
  ): Promise<{ favicon_url: string }> {
    if (!file) {
      throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'file field is required' });
    }
    return this.tenantService.uploadFavicon(req.user!.tenantId, file);
  }
}

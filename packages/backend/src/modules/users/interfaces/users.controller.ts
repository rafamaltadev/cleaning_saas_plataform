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
import { UsersService } from '../application/users.service';
import { CreateUserDto } from '../domain/create-user.dto';
import { UpdateUserDto } from '../domain/update-user.dto';
import { UserResponseDto } from '../domain/user-response.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll(
    @Req() req: Request & { user?: AuthUser },
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.findAll(req.user!.tenantId, query);
  }

  @Post()
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(req.user!.tenantId, req.user!.userId, dto);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(
      req.user!.tenantId,
      req.user!.userId,
      id,
      dto,
    );
  }
}

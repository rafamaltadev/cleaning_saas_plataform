import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AddressesService } from '../application/addresses.service';
import { CreateAddressDto } from '../domain/create-address.dto';
import { UpdateAddressDto } from '../domain/update-address.dto';
import { AddressResponseDto } from '../domain/address-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Controller('v1/addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('supervisor', 'tenant_admin')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(
      req.user!.tenantId,
      req.user!.userId,
      dto,
    );
  }

  @Put(':id')
  update(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.update(
      req.user!.tenantId,
      req.user!.userId,
      id,
      dto,
    );
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../infrastructure/address.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { AddressResponseDto } from '../domain/address-response.dto';
import { CreateAddressDto } from '../domain/create-address.dto';
import { UpdateAddressDto } from '../domain/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepository.save({
      tenant_id: tenantId,
      street: dto.street,
      city: dto.city,
      state: dto.state,
      postal_code: dto.postal_code,
      country: dto.country,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      deleted_at: null,
    });

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'create',
      resource_type: 'address',
      resource_id: address.id,
      new_values: {
        street: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      },
    });

    return AddressResponseDto.from(address);
  }

  async update(
    tenantId: string,
    actorId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findById(addressId, tenantId);
    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }

    const oldValues = {
      street: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    };

    Object.assign(address, dto);
    const saved = await this.addressRepository.save(address);

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'update',
      resource_type: 'address',
      resource_id: addressId,
      old_values: oldValues,
      new_values: {
        street: saved.street,
        city: saved.city,
        state: saved.state,
        postal_code: saved.postal_code,
        country: saved.country,
      },
    });

    return AddressResponseDto.from(saved);
  }
}

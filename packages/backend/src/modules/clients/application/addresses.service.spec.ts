import { NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressRepository } from '../infrastructure/address.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { Address } from '../domain/address.entity';
import { AddressResponseDto } from '../domain/address-response.dto';

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'addr-uuid',
    tenant_id: 'tenant-uuid',
    street: '123 Main St',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01310-100',
    country: 'Brazil',
    latitude: null,
    longitude: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('AddressesService', () => {
  let service: AddressesService;
  let repoMock: jest.Mocked<Pick<AddressRepository, 'findById' | 'save'>>;
  let auditMock: jest.Mocked<Pick<AuditLogService, 'emit'>>;

  beforeEach(() => {
    repoMock = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    auditMock = { emit: jest.fn().mockResolvedValue(undefined) };
    service = new AddressesService(
      repoMock as unknown as AddressRepository,
      auditMock as unknown as AuditLogService,
    );
  });

  describe('create', () => {
    const createDto = {
      street: '123 Main St',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01310-100',
      country: 'Brazil',
    };

    it('returns AddressResponseDto without deleted_at', async () => {
      repoMock.save.mockResolvedValue(makeAddress({ id: 'new-uuid' }));

      const result = await service.create('tenant-uuid', 'actor-uuid', createDto);

      expect(result).toBeInstanceOf(AddressResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('saves address with the correct tenant_id', async () => {
      repoMock.save.mockResolvedValue(makeAddress());

      await service.create('my-tenant', 'actor', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'my-tenant' }),
      );
    });

    it('emits audit log entry with action "create"', async () => {
      repoMock.save.mockResolvedValue(makeAddress({ id: 'new-uuid' }));

      await service.create('tenant-uuid', 'actor-uuid', createDto);

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          resource_type: 'address',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('defaults latitude and longitude to null when not provided', async () => {
      repoMock.save.mockResolvedValue(makeAddress());

      await service.create('t', 'a', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: null, longitude: null }),
      );
    });
  });

  describe('update', () => {
    it('returns AddressResponseDto without deleted_at', async () => {
      repoMock.findById.mockResolvedValue(makeAddress());
      repoMock.save.mockResolvedValue(makeAddress({ street: 'New St' }));

      const result = await service.update('tenant-uuid', 'actor', 'addr-uuid', {
        street: 'New St',
      });

      expect(result).toBeInstanceOf(AddressResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('throws NotFoundException when address does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('tenant-uuid', 'actor', 'missing', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('emits audit log entry with action "update"', async () => {
      repoMock.findById.mockResolvedValue(makeAddress());
      repoMock.save.mockResolvedValue(makeAddress({ street: 'Changed' }));

      await service.update('tenant-uuid', 'actor-uuid', 'addr-uuid', {
        street: 'Changed',
      });

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          resource_type: 'address',
          resource_id: 'addr-uuid',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('calls findById with tenantId for scoped lookup', async () => {
      repoMock.findById.mockResolvedValue(makeAddress());
      repoMock.save.mockResolvedValue(makeAddress());

      await service.update('my-tenant', 'actor', 'addr-uuid', {});

      expect(repoMock.findById).toHaveBeenCalledWith('addr-uuid', 'my-tenant');
    });
  });
});

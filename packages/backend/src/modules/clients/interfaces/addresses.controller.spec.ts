import { AddressesController } from './addresses.controller';
import { AddressesService } from '../application/addresses.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

const mockAddressesService = {
  create: jest.fn(),
  update: jest.fn(),
} as unknown as AddressesService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles: ['supervisor'] } } as any;
}

describe('AddressesController', () => {
  let controller: AddressesController;

  beforeEach(() => {
    controller = new AddressesController(mockAddressesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('delegates to addressesService.create with tenantId, actorId, and dto', async () => {
      const dto = {
        street: '123 Main St',
        city: 'SP',
        state: 'SP',
        postal_code: '01310-100',
        country: 'Brazil',
      };
      const created = { id: 'new-uuid', street: '123 Main St' };
      (mockAddressesService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(
        makeRequest('tenant-uuid', 'actor-uuid'),
        dto as any,
      );

      expect(mockAddressesService.create).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to addressesService.update with tenantId, actorId, id, and dto', async () => {
      const dto = { street: 'Updated St' };
      const updated = { id: 'addr-uuid', street: 'Updated St' };
      (mockAddressesService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'addr-uuid',
        dto as any,
      );

      expect(mockAddressesService.update).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        'addr-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });
});

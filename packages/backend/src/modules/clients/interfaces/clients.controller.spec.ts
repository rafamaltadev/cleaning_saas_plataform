import { ClientsController } from './clients.controller';
import { ClientsService } from '../application/clients.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockClientsService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as ClientsService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles: ['supervisor'] } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(() => {
    controller = new ClientsController(mockClientsService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('delegates to clientsService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockClientsService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.getAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockClientsService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to clientsService.create with tenantId, actorId, and dto', async () => {
      const dto = { name: 'Client', email: 'c@test.com', phone: '+1' };
      const created = { id: 'new-uuid', name: 'Client' };
      (mockClientsService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid', 'actor-uuid'), dto as any);

      expect(mockClientsService.create).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to clientsService.update with tenantId, actorId, id, and dto', async () => {
      const dto = { name: 'Updated' };
      const updated = { id: 'client-uuid', name: 'Updated' };
      (mockClientsService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'client-uuid',
        dto as any,
      );

      expect(mockClientsService.update).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        'client-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });
});

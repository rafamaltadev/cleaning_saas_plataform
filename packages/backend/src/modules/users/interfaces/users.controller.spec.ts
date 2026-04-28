import { UsersController } from './users.controller';
import { UsersService } from '../application/users.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockUsersService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as UsersService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles: ['tenant_admin'] } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(() => {
    controller = new UsersController(mockUsersService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('delegates to usersService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockUsersService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.getAll(
        makeRequest('tenant-uuid'),
        defaultQuery,
      );

      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        'tenant-uuid',
        defaultQuery,
      );
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to usersService.create with tenantId, actorId, and dto', async () => {
      const dto = {
        email: 'new@test.com',
        password: 'pass',
        first_name: 'New',
        last_name: 'User',
        roles: ['staff'],
      };
      const created = { id: 'new-uuid', email: 'new@test.com' };
      (mockUsersService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(
        makeRequest('tenant-uuid', 'actor-uuid'),
        dto,
      );

      expect(mockUsersService.create).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        dto,
      );
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('delegates to usersService.update with tenantId, actorId, userId, and dto', async () => {
      const dto = { first_name: 'Updated' };
      const updated = { id: 'user-uuid', first_name: 'Updated' };
      (mockUsersService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        makeRequest('tenant-uuid', 'actor-uuid'),
        'user-uuid',
        dto,
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(
        'tenant-uuid',
        'actor-uuid',
        'user-uuid',
        dto,
      );
      expect(result).toBe(updated);
    });
  });
});

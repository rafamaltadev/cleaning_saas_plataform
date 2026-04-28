import { AssignmentsController } from './assignments.controller';
import { AssignmentService } from '../application/assignment.service';
import { Request } from 'express';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const mockAssignmentService = {
  findAll: jest.fn(),
  create: jest.fn(),
} as unknown as AssignmentService;

function makeRequest(
  tenantId: string,
  userId = 'actor-uuid',
): Request & { user?: AuthUser } {
  return { user: { userId, tenantId, roles: ['supervisor'] } } as any;
}

const defaultQuery: PaginationQueryDto = { page: 1, limit: 20, order: 'ASC' };

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  beforeEach(() => {
    controller = new AssignmentsController(mockAssignmentService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to assignmentService.findAll with tenantId and query', async () => {
      const result = { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (mockAssignmentService.findAll as jest.Mock).mockResolvedValue(result);

      const response = await controller.findAll(makeRequest('tenant-uuid'), defaultQuery);

      expect(mockAssignmentService.findAll).toHaveBeenCalledWith('tenant-uuid', defaultQuery);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('delegates to assignmentService.create with tenantId, actorId, and dto', async () => {
      const dto = { booking_id: 'b-uuid', employee_id: 'e-uuid' };
      const created = { id: 'assign-uuid' };
      (mockAssignmentService.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(makeRequest('tenant-uuid', 'actor-uuid'), dto as any);

      expect(mockAssignmentService.create).toHaveBeenCalledWith('tenant-uuid', 'actor-uuid', dto);
      expect(result).toBe(created);
    });
  });
});

import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../domain/audit-log.entity';
import { Repository } from 'typeorm';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repoMock: jest.Mocked<Pick<Repository<AuditLog>, 'save'>>;

  beforeEach(() => {
    repoMock = { save: jest.fn().mockResolvedValue({}) };
    service = new AuditLogService(
      repoMock as unknown as Repository<AuditLog>,
    );
  });

  describe('emit', () => {
    it('saves an audit log entry with all required fields', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: 'actor-uuid',
        action: 'create',
        resource_type: 'user',
        resource_id: 'resource-uuid',
        new_values: { email: 'x@x.com' },
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
          action: 'create',
          resource_type: 'user',
          resource_id: 'resource-uuid',
          new_values: { email: 'x@x.com' },
          old_values: null,
        }),
      );
    });

    it('defaults old_values and new_values to null when not provided', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: null,
        action: 'delete',
        resource_type: 'user',
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          old_values: null,
          new_values: null,
          resource_id: null,
        }),
      );
    });

    it('accepts null user_id', async () => {
      await service.emit({
        tenant_id: 'tenant-uuid',
        user_id: null,
        action: 'system',
        resource_type: 'tenant',
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: null }),
      );
    });
  });
});

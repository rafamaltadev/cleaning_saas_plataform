import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from '../infrastructure/user.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { User } from '../../auth/domain/user.entity';
import { UserResponseDto } from '../domain/user-response.dto';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid',
    tenant_id: 'tenant-uuid',
    email: 'user@test.com',
    password_hash: 'hash',
    roles: ['staff'],
    first_name: 'John',
    last_name: 'Doe',
    auth_provider: 'local',
    provider_id: null,
    provider_email_verified: false,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let repoMock: jest.Mocked<
    Pick<UserRepository, 'findPaginated' | 'findById' | 'save'>
  >;
  let auditMock: jest.Mocked<Pick<AuditLogService, 'emit'>>;

  beforeEach(() => {
    repoMock = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    auditMock = { emit: jest.fn().mockResolvedValue(undefined) };
    service = new UsersService(
      repoMock as unknown as UserRepository,
      auditMock as unknown as AuditLogService,
    );
  });

  describe('findAll', () => {
    it('returns paginated UserResponseDtos', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeUser()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', {
        page: 1,
        limit: 20,
        order: 'ASC',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(UserResponseDto);
      expect(result.meta.total).toBe(1);
    });

    it('calls findPaginated with the correct tenantId', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.findAll('my-tenant', { page: 1, limit: 20, order: 'ASC' });

      expect(repoMock.findPaginated).toHaveBeenCalledWith(
        'my-tenant',
        expect.any(Object),
      );
    });

    it('maps items through UserResponseDto (no password_hash)', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeUser({ password_hash: 'secret' })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('t', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items[0]).not.toHaveProperty('password_hash');
    });
  });

  describe('create', () => {
    it('returns UserResponseDto without password_hash', async () => {
      repoMock.save.mockResolvedValue(makeUser({ id: 'new-uuid' }));

      const result = await service.create('tenant-uuid', 'actor-uuid', {
        email: 'new@test.com',
        password: 'pass',
        first_name: 'New',
        last_name: 'User',
        roles: ['staff'],
      });

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('saves user with the correct tenant_id', async () => {
      repoMock.save.mockResolvedValue(makeUser());

      await service.create('my-tenant', 'actor', {
        email: 'x@x.com',
        password: 'pass',
        first_name: 'X',
        last_name: 'Y',
        roles: ['staff'],
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'my-tenant' }),
      );
    });

    it('emits an audit log entry with action "create"', async () => {
      repoMock.save.mockResolvedValue(makeUser({ id: 'new-uuid' }));

      await service.create('tenant-uuid', 'actor-uuid', {
        email: 'a@b.com',
        password: 'p',
        first_name: 'A',
        last_name: 'B',
        roles: ['staff'],
      });

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          resource_type: 'user',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('hashes the password before saving', async () => {
      repoMock.save.mockResolvedValue(makeUser());

      await service.create('t', 'a', {
        email: 'e@e.com',
        password: 'plaintext',
        first_name: 'F',
        last_name: 'L',
        roles: ['staff'],
      });

      const savedArg = repoMock.save.mock.calls[0][0] as any;
      expect(savedArg.password_hash).not.toBe('plaintext');
      expect(savedArg.password_hash).toBeDefined();
    });
  });

  describe('update', () => {
    it('returns UserResponseDto without sensitive fields', async () => {
      repoMock.findById.mockResolvedValue(makeUser());
      repoMock.save.mockResolvedValue(makeUser({ first_name: 'Updated' }));

      const result = await service.update('tenant-uuid', 'actor', 'user-uuid', {
        first_name: 'Updated',
      });

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('throws NotFoundException when user not found', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(
        service.update('tenant-uuid', 'actor', 'missing', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('emits an audit log entry with action "update"', async () => {
      repoMock.findById.mockResolvedValue(makeUser());
      repoMock.save.mockResolvedValue(makeUser({ first_name: 'Changed' }));

      await service.update('tenant-uuid', 'actor-uuid', 'user-uuid', {
        first_name: 'Changed',
      });

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          resource_type: 'user',
          resource_id: 'user-uuid',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('calls findById with tenantId for isolation', async () => {
      repoMock.findById.mockResolvedValue(makeUser());
      repoMock.save.mockResolvedValue(makeUser());

      await service.update('my-tenant', 'actor', 'user-uuid', {});

      expect(repoMock.findById).toHaveBeenCalledWith('user-uuid', 'my-tenant');
    });
  });
});

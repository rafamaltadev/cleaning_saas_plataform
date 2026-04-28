import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientRepository } from '../infrastructure/client.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { Client } from '../domain/client.entity';
import { ClientResponseDto } from '../domain/client-response.dto';

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+5511999999999',
    address_id: null,
    preferred_language: 'pt-BR',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('ClientsService', () => {
  let service: ClientsService;
  let repoMock: jest.Mocked<
    Pick<ClientRepository, 'findPaginated' | 'findById' | 'findByIdUnscoped' | 'save'>
  >;
  let auditMock: jest.Mocked<Pick<AuditLogService, 'emit'>>;

  beforeEach(() => {
    repoMock = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      findByIdUnscoped: jest.fn(),
      save: jest.fn(),
    };
    auditMock = { emit: jest.fn().mockResolvedValue(undefined) };
    service = new ClientsService(
      repoMock as unknown as ClientRepository,
      auditMock as unknown as AuditLogService,
    );
  });

  describe('findAll', () => {
    it('returns paginated ClientResponseDtos', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeClient()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('tenant-uuid', { page: 1, limit: 20, order: 'ASC' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(ClientResponseDto);
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

    it('maps items through ClientResponseDto (no deleted_at)', async () => {
      repoMock.findPaginated.mockResolvedValue({
        items: [makeClient({ deleted_at: new Date() })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll('t', { page: 1, limit: 20, order: 'ASC' });
      expect(result.items[0]).not.toHaveProperty('deleted_at');
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Client',
      email: 'new@test.com',
      phone: '+5511',
      preferred_language: 'pt-BR' as const,
    };

    it('returns ClientResponseDto without deleted_at', async () => {
      repoMock.save.mockResolvedValue(makeClient({ id: 'new-uuid' }));

      const result = await service.create('tenant-uuid', 'actor-uuid', createDto);

      expect(result).toBeInstanceOf(ClientResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('saves client with the correct tenant_id', async () => {
      repoMock.save.mockResolvedValue(makeClient());

      await service.create('my-tenant', 'actor', createDto);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'my-tenant' }),
      );
    });

    it('emits audit log entry with action "create"', async () => {
      repoMock.save.mockResolvedValue(makeClient({ id: 'new-uuid' }));

      await service.create('tenant-uuid', 'actor-uuid', createDto);

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          resource_type: 'client',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('defaults preferred_language to pt-BR when not provided', async () => {
      repoMock.save.mockResolvedValue(makeClient());

      await service.create('tenant', 'actor', {
        name: 'X',
        email: 'x@x.com',
        phone: '+1',
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ preferred_language: 'pt-BR' }),
      );
    });
  });

  describe('update', () => {
    it('returns ClientResponseDto without deleted_at', async () => {
      repoMock.findByIdUnscoped.mockResolvedValue(makeClient());
      repoMock.save.mockResolvedValue(makeClient({ name: 'Updated' }));

      const result = await service.update('tenant-uuid', 'actor', 'client-uuid', {
        name: 'Updated',
      });

      expect(result).toBeInstanceOf(ClientResponseDto);
      expect(result).not.toHaveProperty('deleted_at');
    });

    it('throws NotFoundException when client does not exist', async () => {
      repoMock.findByIdUnscoped.mockResolvedValue(null);

      await expect(
        service.update('tenant-uuid', 'actor', 'missing', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when client belongs to a different tenant', async () => {
      repoMock.findByIdUnscoped.mockResolvedValue(
        makeClient({ tenant_id: 'other-tenant' }),
      );

      await expect(
        service.update('tenant-uuid', 'actor', 'client-uuid', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('emits audit log entry with action "update"', async () => {
      repoMock.findByIdUnscoped.mockResolvedValue(makeClient());
      repoMock.save.mockResolvedValue(makeClient({ name: 'Changed' }));

      await service.update('tenant-uuid', 'actor-uuid', 'client-uuid', {
        name: 'Changed',
      });

      expect(auditMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          resource_type: 'client',
          resource_id: 'client-uuid',
          tenant_id: 'tenant-uuid',
          user_id: 'actor-uuid',
        }),
      );
    });

    it('uses findByIdUnscoped for cross-tenant detection', async () => {
      repoMock.findByIdUnscoped.mockResolvedValue(makeClient());
      repoMock.save.mockResolvedValue(makeClient());

      await service.update('tenant-uuid', 'actor', 'client-uuid', {});

      expect(repoMock.findByIdUnscoped).toHaveBeenCalledWith('client-uuid');
    });
  });
});

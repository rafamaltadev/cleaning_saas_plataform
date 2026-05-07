import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientRepository } from '../infrastructure/client.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { ClientResponseDto } from '../domain/client-response.dto';
import { CreateClientDto } from '../domain/create-client.dto';
import { UpdateClientDto } from '../domain/update-client.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ListClientsQueryDto } from '../domain/list-clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListClientsQueryDto,
  ): Promise<PaginatedResult<ClientResponseDto>> {
    const result = await this.clientRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(ClientResponseDto.from),
      meta: result.meta,
    };
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository.save({
      tenant_id: tenantId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address_id: dto.address_id ?? null,
      preferred_language: dto.preferred_language ?? 'pt-BR',
      deleted_at: null,
    });

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'create',
      resource_type: 'client',
      resource_id: client.id,
      new_values: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address_id: client.address_id,
        preferred_language: client.preferred_language,
      },
    });

    return ClientResponseDto.from(client);
  }

  async findOne(tenantId: string, clientId: string): Promise<ClientResponseDto> {
    const client = await this.clientRepository.findById(clientId, tenantId);
    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found',
      });
    }
    return ClientResponseDto.from(client);
  }

  async remove(tenantId: string, clientId: string): Promise<void> {
    const existing = await this.clientRepository.findById(clientId, tenantId);
    if (!existing) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found',
      });
    }
    await this.clientRepository.softDelete(clientId);
  }

  async update(
    tenantId: string,
    actorId: string,
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const existing = await this.clientRepository.findByIdUnscoped(clientId);
    if (!existing) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found',
      });
    }
    if (existing.tenant_id !== tenantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    const oldValues = {
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      address_id: existing.address_id,
      preferred_language: existing.preferred_language,
    };

    Object.assign(existing, dto);
    const saved = await this.clientRepository.save(existing);

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'update',
      resource_type: 'client',
      resource_id: clientId,
      old_values: oldValues,
      new_values: {
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        address_id: saved.address_id,
        preferred_language: saved.preferred_language,
      },
    });

    return ClientResponseDto.from(saved);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../domain/audit-log.entity';

export interface EmitAuditLogDto {
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async emit(dto: EmitAuditLogDto): Promise<void> {
    await this.repository.save({
      tenant_id: dto.tenant_id,
      user_id: dto.user_id,
      action: dto.action,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id ?? null,
      old_values: dto.old_values ?? null,
      new_values: dto.new_values ?? null,
    });
  }
}

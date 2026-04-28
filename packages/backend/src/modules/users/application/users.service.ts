import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../infrastructure/user.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { UserResponseDto } from '../domain/user-response.dto';
import { CreateUserDto } from '../domain/create-user.dto';
import { UpdateUserDto } from '../domain/update-user.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(UserResponseDto.from),
      meta: result.meta,
    };
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.save({
      tenant_id: tenantId,
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      roles: dto.roles,
      deleted_at: null,
    });

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'create',
      resource_type: 'user',
      resource_id: user.id,
      new_values: {
        email: user.email,
        roles: user.roles,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    return UserResponseDto.from(user);
  }

  async update(
    tenantId: string,
    actorId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const oldValues = {
      first_name: user.first_name,
      last_name: user.last_name,
      roles: user.roles,
    };

    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'update',
      resource_type: 'user',
      resource_id: userId,
      old_values: oldValues,
      new_values: {
        first_name: saved.first_name,
        last_name: saved.last_name,
        roles: saved.roles,
      },
    });

    return UserResponseDto.from(saved);
  }
}

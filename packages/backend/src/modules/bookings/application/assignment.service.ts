import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentRepository } from '../infrastructure/assignment.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { AssignmentResponseDto } from '../domain/assignment-response.dto';
import { CreateAssignmentDto } from '../validation/create-assignment.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly auditLogService: AuditLogService,
    private readonly domainEventBus: DomainEventBus,
  ) {}

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateAssignmentDto,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentRepository.save({
      tenant_id: tenantId,
      booking_id: dto.booking_id,
      employee_id: dto.employee_id,
      status: 'assigned' as const,
      completed_at: null,
      deleted_at: null,
    });

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'create',
      resource_type: 'assignment',
      resource_id: assignment.id,
      new_values: {
        booking_id: dto.booking_id,
        employee_id: dto.employee_id,
        status: 'assigned',
      },
    });

    this.domainEventBus.emit('assignment.created', {
      assignmentId: assignment.id,
      tenantId,
      bookingId: dto.booking_id,
      employeeId: dto.employee_id,
      userId: actorId,
    });

    return AssignmentResponseDto.from(assignment);
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<AssignmentResponseDto>> {
    const result = await this.assignmentRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(AssignmentResponseDto.from),
      meta: result.meta,
    };
  }

  async findById(id: string, tenantId: string): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentRepository.findById(id, tenantId);
    if (!assignment) {
      throw new NotFoundException({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      });
    }
    return AssignmentResponseDto.from(assignment);
  }
}
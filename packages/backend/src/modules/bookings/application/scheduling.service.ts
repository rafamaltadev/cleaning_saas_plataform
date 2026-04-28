import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AvailabilityRepository } from '../infrastructure/availability.repository';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { AvailabilityResponseDto } from '../domain/availability-response.dto';
import { CreateAvailabilityDto } from '../validation/create-availability.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createAvailability(
    tenantId: string,
    actorId: string,
    dto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const conflicts = await this.availabilityRepository.findConflicts(
      tenantId,
      dto.employee_id,
      dto.available_date,
      dto.start_time,
      dto.end_time,
    );
    if (conflicts.length > 0) {
      throw new BadRequestException({
        code: 'AVAILABILITY_CONFLICT',
        message: 'Overlapping availability slot exists for this employee on this date',
      });
    }

    const availability = await this.availabilityRepository.save({
      tenant_id: tenantId,
      employee_id: dto.employee_id,
      available_date: dto.available_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      deleted_at: null,
    });

    await this.auditLogService.emit({
      tenant_id: tenantId,
      user_id: actorId,
      action: 'create',
      resource_type: 'availability',
      resource_id: availability.id,
      new_values: {
        employee_id: dto.employee_id,
        available_date: dto.available_date,
        start_time: dto.start_time,
        end_time: dto.end_time,
      },
    });

    return AvailabilityResponseDto.from(availability);
  }

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<AvailabilityResponseDto>> {
    const result = await this.availabilityRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(AvailabilityResponseDto.from),
      meta: result.meta,
    };
  }

  async findById(id: string, tenantId: string): Promise<AvailabilityResponseDto> {
    const availability = await this.availabilityRepository.findById(id, tenantId);
    if (!availability) {
      throw new NotFoundException({
        code: 'AVAILABILITY_NOT_FOUND',
        message: 'Availability not found',
      });
    }
    return AvailabilityResponseDto.from(availability);
  }
}
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QuoteRepository } from '../infrastructure/quote.repository';
import { ServiceRepository } from '../../services/infrastructure/service.repository';
import { PricingRuleRepository } from '../../services/infrastructure/pricing-rule.repository';
import { PricingService } from '../../services/application/pricing.service';
import { DomainEventBus } from '../../../common/events/domain-event-bus';
import { Quote, QuoteStatus } from '../domain/quote.entity';
import { QuoteResponseDto } from '../domain/quote-response.dto';
import { CreateQuoteDto } from '../validation/create-quote.dto';
import { UpdateQuoteDto } from '../validation/update-quote.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'expired', 'rejected'],
  accepted: [],
  expired: [],
  rejected: [],
};

@Injectable()
export class QuoteService {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly pricingRuleRepository: PricingRuleRepository,
    private readonly pricingService: PricingService,
    private readonly domainEventBus: DomainEventBus,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private assertValidTransition(from: QuoteStatus, to: QuoteStatus): void {
    if (!VALID_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition quote from '${from}' to '${to}'`,
      });
    }
  }

  private shouldExpire(quote: Quote): boolean {
    return quote.status === 'sent' && new Date(quote.valid_until) < new Date();
  }

  private async applyLazyExpiration(quote: Quote, actorId: string): Promise<void> {
    if (!this.shouldExpire(quote)) return;
    const oldStatus = quote.status;
    await this.dataSource.transaction(async (manager) => {
      quote.status = 'expired';
      await manager.save(Quote, quote);
    });
    this.domainEventBus.emit('quote.expired', {
      quoteId: quote.id,
      tenantId: quote.tenant_id,
      userId: actorId,
      oldValues: { status: oldStatus },
      newValues: { status: 'expired' },
    });
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    const service = await this.serviceRepository.findById(dto.service_id, tenantId);
    if (!service) {
      throw new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
    }

    if (service.unit === 'sqm' && dto.area_sqm == null) {
      throw new BadRequestException({
        code: 'AREA_REQUIRED',
        message: 'area_sqm is required when service unit is sqm',
      });
    }
    if (service.unit === 'hour' && dto.duration_hours == null) {
      throw new BadRequestException({
        code: 'DURATION_REQUIRED',
        message: 'duration_hours is required when service unit is hour',
      });
    }

    let pricingRule = null;
    if (dto.pricing_rule_id) {
      pricingRule = await this.pricingRuleRepository.findById(dto.pricing_rule_id, tenantId);
    }

    const estimatedTotalCents = this.pricingService.calculate({
      unit: service.unit,
      base_rate_cents: service.base_rate_cents,
      area_sqm: dto.area_sqm,
      duration_hours: dto.duration_hours,
      price_multiplier: pricingRule ? Number(pricingRule.price_multiplier) : 1,
      discount_percent: pricingRule?.discount_percent ?? 0,
      manual_discount_percent: dto.manual_discount_percent ?? 0,
    });

    const quote = await this.quoteRepository.save({
      tenant_id: tenantId,
      client_id: dto.client_id,
      service_id: dto.service_id,
      pricing_rule_id: dto.pricing_rule_id ?? null,
      status: 'draft' as QuoteStatus,
      estimated_total_cents: estimatedTotalCents,
      currency: dto.currency,
      valid_until: new Date(dto.valid_until),
      manual_discount_percent: dto.manual_discount_percent ?? 0,
      created_by: actorId,
      deleted_at: null,
    });

    this.domainEventBus.emit('quote.created', {
      quoteId: quote.id,
      tenantId,
      userId: actorId,
      newValues: {
        status: quote.status,
        estimated_total_cents: quote.estimated_total_cents,
      },
    });

    return QuoteResponseDto.from(quote);
  }

  async findAll(
    tenantId: string,
    actorId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<QuoteResponseDto>> {
    const result = await this.quoteRepository.findPaginated(tenantId, query);

    for (const quote of result.items) {
      await this.applyLazyExpiration(quote, actorId);
    }

    return {
      items: result.items.map(QuoteResponseDto.from),
      meta: result.meta,
    };
  }

  async findById(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.quoteRepository.findById(id, tenantId);
    if (!quote) {
      throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
    }

    await this.applyLazyExpiration(quote, actorId);

    return QuoteResponseDto.from(quote);
  }

  async update(
    id: string,
    tenantId: string,
    actorId: string,
    dto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    void actorId;
    const quote = await this.quoteRepository.findById(id, tenantId);
    if (!quote) {
      throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
    }

    if (dto.status) {
      this.assertValidTransition(quote.status, dto.status as QuoteStatus);
      quote.status = dto.status as QuoteStatus;
    }

    if (dto.manual_discount_percent != null) {
      quote.manual_discount_percent = dto.manual_discount_percent;
    }

    const saved = await this.quoteRepository.save(quote);

    return QuoteResponseDto.from(saved);
  }

  async send(
    id: string,
    tenantId: string,
    actorId: string,
    permissions: string[],
  ): Promise<QuoteResponseDto> {
    if (!permissions?.includes('quotes.send')) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Requires quotes.send permission',
      });
    }

    const quote = await this.quoteRepository.findById(id, tenantId);
    if (!quote) {
      throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
    }

    this.assertValidTransition(quote.status, 'sent');

    const oldStatus = quote.status;
    await this.dataSource.transaction(async (manager) => {
      quote.status = 'sent';
      await manager.save(Quote, quote);
    });

    this.domainEventBus.emit('quote.sent', {
      quoteId: id,
      tenantId,
      userId: actorId,
      oldValues: { status: oldStatus },
      newValues: { status: 'sent' },
    });

    return QuoteResponseDto.from(quote);
  }

  async acceptQuote(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.quoteRepository.findById(id, tenantId);
    if (!quote) {
      throw new NotFoundException({ code: 'QUOTE_NOT_FOUND', message: 'Quote not found' });
    }

    this.assertValidTransition(quote.status, 'accepted');

    const oldStatus = quote.status;
    await this.dataSource.transaction(async (manager) => {
      quote.status = 'accepted';
      await manager.save(Quote, quote);
    });

    this.domainEventBus.emit('quote.accepted', {
      quoteId: id,
      tenantId,
      userId: actorId,
      oldValues: { status: oldStatus },
      newValues: { status: 'accepted' },
    });

    return QuoteResponseDto.from(quote);
  }
}

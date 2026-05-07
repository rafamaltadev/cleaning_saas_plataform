import { Injectable, NotFoundException } from '@nestjs/common';
import { PricingRuleRepository } from '../infrastructure/pricing-rule.repository';
import { PricingRuleResponseDto } from '../domain/pricing-rule-response.dto';
import { CreatePricingRuleDto } from '../domain/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from '../domain/update-pricing-rule.dto';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class PricingRulesService {
  constructor(private readonly pricingRuleRepository: PricingRuleRepository) {}

  async findAll(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PricingRuleResponseDto>> {
    const result = await this.pricingRuleRepository.findPaginated(tenantId, query);
    return {
      items: result.items.map(PricingRuleResponseDto.from),
      meta: result.meta,
    };
  }

  async create(tenantId: string, dto: CreatePricingRuleDto): Promise<PricingRuleResponseDto> {
    const rule = await this.pricingRuleRepository.save({
      tenant_id: tenantId,
      service_id: dto.service_id,
      min_area: dto.min_area ?? null,
      max_area: dto.max_area ?? null,
      frequency: dto.frequency,
      discount_percent: dto.discount_percent,
      price_multiplier: dto.price_multiplier,
      deleted_at: null,
    });
    return PricingRuleResponseDto.from(rule);
  }

  async findByServiceId(
    tenantId: string,
    serviceId: string,
  ): Promise<PricingRuleResponseDto | null> {
    const rule = await this.pricingRuleRepository.findByServiceId(serviceId, tenantId);
    return rule ? PricingRuleResponseDto.from(rule) : null;
  }

  async update(
    tenantId: string,
    ruleId: string,
    dto: UpdatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    const existing = await this.pricingRuleRepository.findById(ruleId, tenantId);
    if (!existing) {
      throw new NotFoundException({
        code: 'PRICING_RULE_NOT_FOUND',
        message: 'Pricing rule not found',
      });
    }
    Object.assign(existing, dto);
    const saved = await this.pricingRuleRepository.save(existing);
    return PricingRuleResponseDto.from(saved);
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { StripePlatformService } from '../stripe/stripe-platform.service';
import { CreateSubscriptionPlanDto } from '../validation/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../validation/update-subscription-plan.dto';
import { TenantSubscription } from './tenant-subscription.entity';

@Injectable()
export class SubscriptionPlanService {
  private readonly logger = new Logger(SubscriptionPlanService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly stripePlatformService: StripePlatformService,
  ) {}

  async findActivePlans(currency: string): Promise<SubscriptionPlan[]> {
    return this.dataSource.getRepository(SubscriptionPlan).find({
      where: { is_active: true, currency: currency.toUpperCase(), deleted_at: IsNull() },
      order: { amount_cents: 'ASC' },
    });
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.dataSource.getRepository(SubscriptionPlan).find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    let plan!: SubscriptionPlan;

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const stripePrice = await this.stripePlatformService.createPrice({
        productName: dto.name,
        amountCents: dto.amount_cents,
        currency: dto.currency,
        interval: dto.interval,
        intervalCount: dto.interval_count,
        tier: dto.tier,
      }).catch((err) => {
        this.logger.error('Stripe price creation failed — rolling back', err);
        throw new BadRequestException('Failed to create Stripe price: ' + String(err));
      });

      plan = await manager.save(SubscriptionPlan, {
        name: dto.name,
        description: dto.description ?? null,
        tier: dto.tier,
        stripe_price_id: stripePrice.id,
        interval: dto.interval,
        interval_count: dto.interval_count,
        amount_cents: dto.amount_cents,
        currency: dto.currency,
        is_active: true,
        valid_from: new Date(),
        valid_until: null,
        deleted_at: null,
      });
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const repo = this.dataSource.getRepository(SubscriptionPlan);
    const plan = await repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.description !== undefined) plan.description = dto.description ?? null;
    if (dto.tier !== undefined) plan.tier = dto.tier;
    if (dto.is_active !== undefined) plan.is_active = dto.is_active;
    if (dto.amount_cents !== undefined) plan.amount_cents = dto.amount_cents;

    return repo.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const repo = this.dataSource.getRepository(SubscriptionPlan);
    const plan = await repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!plan) throw new NotFoundException('Plan not found');

    const activeSubCount = await this.dataSource
      .getRepository(TenantSubscription)
      .count({ where: { plan_id: id, status: 'active' } });

    if (activeSubCount > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }

    plan.is_active = false;
    plan.valid_until = new Date();
    plan.deleted_at = new Date();
    await repo.save(plan);
  }
}

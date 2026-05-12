import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QuoteAddonRepository } from '../infrastructure/quote-addon.repository';
import { QuoteAddon } from '../domain/quote-addon.entity';
import { QuoteAddonResponseDto } from '../domain/quote-addon-response.dto';
import { CreateQuoteAddonDto } from '../validation/create-quote-addon.dto';

@Injectable()
export class QuoteAddonsService {
  constructor(
    private readonly quoteAddonRepository: QuoteAddonRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findByQuoteId(tenantId: string, quoteId: string): Promise<QuoteAddonResponseDto[]> {
    const addons = await this.quoteAddonRepository.findByQuoteId(quoteId, tenantId);
    return addons.map(QuoteAddonResponseDto.from);
  }

  async syncAddons(
    tenantId: string,
    quoteId: string,
    addons: CreateQuoteAddonDto[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(QuoteAddon)
        .set({ deleted_at: new Date() })
        .where(
          'quote_id = :quoteId AND tenant_id = :tenantId AND deleted_at IS NULL',
          { quoteId, tenantId },
        )
        .execute();

      if (addons.length > 0) {
        const newAddons = addons.map((dto) => {
          const a = new QuoteAddon();
          a.tenant_id = tenantId;
          a.quote_id = quoteId;
          a.addon_id = dto.addon_id;
          a.name = dto.name;
          a.price_cents = dto.price_cents;
          a.deleted_at = null;
          return a;
        });
        await manager.save(QuoteAddon, newAddons);
      }
    });
  }
}

import { QuoteAddon } from './quote-addon.entity';

export class QuoteAddonResponseDto {
  id: string;
  addon_id: string;
  name: string;
  price_cents: number;

  static from(addon: QuoteAddon): QuoteAddonResponseDto {
    const dto = new QuoteAddonResponseDto();
    dto.id = addon.id;
    dto.addon_id = addon.addon_id;
    dto.name = addon.name;
    dto.price_cents = addon.price_cents;
    return dto;
  }
}

import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteAddonDto } from './create-quote-addon.dto';

export class SyncQuoteAddonsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteAddonDto)
  addons: CreateQuoteAddonDto[];
}

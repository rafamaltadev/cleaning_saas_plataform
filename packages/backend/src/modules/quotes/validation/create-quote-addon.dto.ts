import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreateQuoteAddonDto {
  @Matches(UUID_REGEX, UUID_MSG)
  addon_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  price_cents: number;
}

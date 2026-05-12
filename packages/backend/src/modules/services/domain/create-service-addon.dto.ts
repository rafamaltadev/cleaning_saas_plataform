import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreateServiceAddonDto {
  @Matches(UUID_REGEX, UUID_MSG)
  service_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price_cents: number;
}

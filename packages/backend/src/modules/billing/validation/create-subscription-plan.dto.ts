import { IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

void UUID_REGEX;
void UUID_MSG;

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  tier: string;

  @IsIn(['month', 'semiannual', 'year'])
  interval: 'month' | 'semiannual' | 'year';

  @IsInt()
  @Min(1)
  interval_count: number;

  @IsInt()
  @Min(1)
  amount_cents: number;

  @IsIn(['BRL', 'USD'])
  currency: 'BRL' | 'USD';
}

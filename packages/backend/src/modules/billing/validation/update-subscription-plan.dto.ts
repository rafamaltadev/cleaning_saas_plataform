import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsIn(['month', 'semiannual', 'year'])
  interval?: 'month' | 'semiannual' | 'year';

  @IsOptional()
  @IsInt()
  @Min(1)
  interval_count?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount_cents?: number;

  @IsOptional()
  @IsIn(['BRL', 'USD'])
  currency?: 'BRL' | 'USD';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

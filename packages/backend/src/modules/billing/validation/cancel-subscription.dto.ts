import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @IsBoolean()
  at_period_end: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

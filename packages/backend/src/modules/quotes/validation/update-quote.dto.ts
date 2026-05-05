import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateQuoteDto {
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  manual_discount_percent?: number;

  @IsIn(['rejected', 'accepted'])
  @IsOptional()
  status?: 'rejected' | 'accepted';
}

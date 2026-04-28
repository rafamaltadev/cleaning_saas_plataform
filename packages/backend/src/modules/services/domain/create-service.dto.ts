import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  base_rate_cents: number;

  @IsIn(['sqm', 'hour', 'flat'])
  unit: 'sqm' | 'hour' | 'flat';
}

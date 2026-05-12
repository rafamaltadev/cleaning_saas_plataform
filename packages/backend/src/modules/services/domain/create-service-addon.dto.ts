import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceAddonDto {
  @IsUUID('all')
  service_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price_cents: number;
}

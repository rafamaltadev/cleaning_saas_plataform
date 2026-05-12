import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateQuoteAddonDto {
  @IsUUID()
  addon_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  price_cents: number;
}

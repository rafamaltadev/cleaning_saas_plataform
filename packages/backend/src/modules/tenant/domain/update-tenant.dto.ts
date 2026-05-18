import { IsIn, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['BRL', 'USD'])
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, { message: 'tenant_slug must contain only lowercase letters, numbers and hyphens' })
  tenant_slug?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  favicon_url?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'primary_color must be a 6-digit hex color' })
  primary_color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsObject()
  social_links?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !value.trim()) return value;
    let url = value.trim();
    if (url.includes('<iframe')) {
      const match = /src=["']([^"']+)["']/.exec(url);
      url = match ? match[1] : '';
    }
    const junk = /["'\s]/.exec(url);
    if (junk) url = url.slice(0, junk.index);
    return url || undefined;
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^https:\/\/(www\.)?google\.com\/maps\/embed\?[^"'<>\s]+$/, { message: 'Must be a Google Maps embed URL' })
  google_maps_embed_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public_address?: string;
}

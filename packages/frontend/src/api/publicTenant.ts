import axios from 'axios';

const publicClient = axios.create({ baseURL: '/api/v1/public' });

export interface PublicBranding {
  tenant_slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  favicon_url: string | null;
}

export interface PublicProfile {
  tenant_slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  social_links: { instagram?: string; facebook?: string; whatsapp?: string; website?: string } | null;
  google_maps_embed_url: string | null;
  public_address: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  unit: string;
  currency: string;
  category_name: string | null;
}

export async function getPublicBranding(tenantSlug: string): Promise<PublicBranding> {
  const { data } = await publicClient.get<{ data: PublicBranding }>(`/${tenantSlug}/branding`);
  return data.data;
}

export async function getPublicProfile(tenantSlug: string): Promise<PublicProfile> {
  const { data } = await publicClient.get<{ data: PublicProfile }>(`/${tenantSlug}/profile`);
  return data.data;
}

export async function getPublicServices(tenantSlug: string): Promise<PublicService[]> {
  const { data } = await publicClient.get<{ data: PublicService[] }>(`/${tenantSlug}/services`);
  return data.data;
}

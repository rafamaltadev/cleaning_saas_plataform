export type UserRole = 'tenant_admin' | 'supervisor' | 'staff' | 'platform_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  timezone: string;
  currency: string;
  tenant_slug?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  favicon_url?: string | null;
  description?: string;
  phone?: string;
  public_address?: string;
  google_maps_embed_url?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };
  businessHours?: BusinessHours;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Service {
  id: string;
  name: string;
  baseRate: number;
  base_rate_cents?: number;
  unit?: 'sqm' | 'hour' | 'flat';
  description?: string;
  category_id?: string | null;
  category_name?: string;
  estimated_duration_minutes?: number | null;
  billing_type?: string;
  availability?: object | null;
  materials_included?: boolean;
  materials_cost_cents?: number | null;
  observations?: string | null;
  has_addons?: boolean;
}

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  price_cents: number;
}

export type QuoteStatus = 'new_lead' | 'contacted' | 'quote_sent';
export type BookingStatus = 'booking_confirmed' | 'completed' | 'cancelled';
export type KanbanStatus = QuoteStatus | BookingStatus | 'pending_approval';

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  status: QuoteStatus;
  scheduledDate?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  status: BookingStatus;
  scheduledDate?: string;
  createdAt: string;
}

export interface KanbanCard {
  id: string;
  type: 'quote' | 'booking';
  clientName: string;
  serviceName: string;
  scheduledDate?: string;
  status: KanbanStatus;
}

// ── API-aligned types (T14) ─────────────────────────────────────────────────

export interface QuoteAddon {
  id: string;
  addon_id: string;
  name: string;
  price_cents: number;
}

export type ApiQuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
export type ApiBookingStatus = 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'pending_approval';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedApiResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiQuote {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  pricing_rule_id: string | null;
  status: ApiQuoteStatus;
  estimated_total_cents: number;
  currency: string;
  valid_until: string;
  manual_discount_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  service_name?: string;
  pricing_rule_name?: string;
  service_address?: string | null;
  use_client_address?: boolean;
  area_sqm?: number | null;
  observations?: string | null;
  service_date?: string | null;
  addons?: QuoteAddon[];
}

export interface ApiBooking {
  id: string;
  tenant_id: string;
  quote_id: string;
  client_id: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: ApiBookingStatus;
  assigned_team: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  service_name?: string;
  service_address?: string | null;
  use_client_address?: boolean;
  observations?: string | null;
  quote_total_cents?: number;
  origin?: 'internal' | 'public';
  approval_required?: boolean;
}

export interface ApiPricingRule {
  id: string;
  tenant_id: string;
  service_id: string;
  min_area: number | null;
  max_area: number | null;
  frequency: string;
  discount_percent: number;
  price_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface ApiNotification {
  id: string;
  tenant_id: string;
  client_id: string | null;
  booking_id: string | null;
  quote_id: string | null;
  type: string;
  template: string;
  status: string;
  sent_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

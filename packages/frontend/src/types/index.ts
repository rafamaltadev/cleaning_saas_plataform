export type UserRole = 'tenant_admin' | 'supervisor' | 'staff';

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
  description?: string;
}

export type QuoteStatus = 'new_lead' | 'contacted' | 'quote_sent';
export type BookingStatus = 'booking_confirmed' | 'completed' | 'cancelled';
export type KanbanStatus = QuoteStatus | BookingStatus;

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

import type { UserRole } from '../types';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  tenant_admin: ['quotes.send', 'bookings.complete', 'settings.manage'],
  supervisor: ['quotes.send', 'bookings.complete'],
  staff: [],
};

export function hasPermission(role: UserRole | undefined | null, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

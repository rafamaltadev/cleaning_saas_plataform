import type { User, UserRole } from '../types';

export function buildUserFromAccessToken(token: string, email: string): User {
  const [, payloadB64] = token.split('.');
  const payload = JSON.parse(atob(payloadB64)) as { sub: string; tenantId: string; roles: string[] };
  return {
    id: payload.sub,
    email,
    name: '',
    role: (payload.roles?.[0] ?? 'staff') as UserRole,
    tenantId: payload.tenantId,
  };
}

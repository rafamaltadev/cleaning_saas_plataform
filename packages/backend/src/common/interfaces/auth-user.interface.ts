export interface AuthUser {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions?: string[];
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

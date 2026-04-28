export interface JwtPayload {
  sub: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

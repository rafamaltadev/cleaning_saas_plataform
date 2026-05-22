function getSessionKey(tenantSlug: string): string {
  return `public-session-${tenantSlug}`;
}

export function savePublicSession(tenantSlug: string, accessToken: string): void {
  sessionStorage.setItem(getSessionKey(tenantSlug), accessToken);
}

export function loadPublicSession(tenantSlug: string): string | null {
  return sessionStorage.getItem(getSessionKey(tenantSlug));
}

export function clearPublicSession(tenantSlug: string): void {
  sessionStorage.removeItem(getSessionKey(tenantSlug));
}

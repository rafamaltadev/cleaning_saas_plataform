export interface QuoteDraft {
  tenantSlug: string;
  serviceId: string;
  serviceName: string;
  area_sqm?: number;
  duration_hours?: number;
  addon_ids: string[];
  address: string;
  city: string;
  state: string;
  postal_code: string;
  observations: string;
  name: string;
  email: string;
  phone: string;
  subtotal_cents?: number;
  addon_total_cents?: number;
  discount_amount_cents?: number;
  estimated_total_cents?: number;
  currency?: string;
}

function getDraftKey(tenantSlug: string): string {
  return `public-quote-draft-${tenantSlug}`;
}

export function saveDraft(tenantSlug: string, draft: QuoteDraft): void {
  sessionStorage.setItem(getDraftKey(tenantSlug), JSON.stringify(draft));
}

export function loadDraft(tenantSlug: string): QuoteDraft | null {
  const raw = sessionStorage.getItem(getDraftKey(tenantSlug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuoteDraft;
  } catch {
    return null;
  }
}

export function clearDraft(tenantSlug: string): void {
  sessionStorage.removeItem(getDraftKey(tenantSlug));
}

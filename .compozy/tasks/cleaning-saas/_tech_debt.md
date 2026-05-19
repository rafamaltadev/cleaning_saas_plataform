# Tech Debt — Cleaning SaaS

## Process improvements

### Phase 1 pattern enforcement (high priority)
Add a pre-commit hook or CI check that fails if @IsUUID() is used
anywhere outside test files. Phase 1 pattern requires
@Matches(UUID_REGEX, UUID_MSG) for all UUID validation in DTOs. This
bug appeared 3+ times during Phase 2 (T17, T18, T19) — repeated
violation indicates automation is needed, not vigilance.

## Discovered during Phase 2 implementation

### URL structure exposes UUIDs (low priority)
6 admin routes use raw UUIDs in URLs (/services/:id/edit,
/quotes/:id/edit, /bookings/:id/edit, etc.). Recommendation: replace
with slug or short ID after Phase 2 stabilizes. Out of scope for
current phase.

### Redundant service_id in addon payload (low priority)
packages/frontend/src/api/addons.ts:17 sends service_id in request body
even though the backend already receives it from the route param.
Coupling can cause silent bugs if the two diverge. Consider removing
service_id from CreateServiceAddonDto and reading it only from the
route param.

### Remaining @IsUUID() usages — needs systematic refactor (medium priority)
A dedicated post-Phase-2 task should sweep ALL DTOs and replace any
remaining @IsUUID() with @Matches(UUID_REGEX, UUID_MSG).

Current state (post-T19):
- Total @IsUUID() occurrences: 14
- Files affected:
  packages/backend/src/modules/notifications/validation/send-notification.dto.ts:18
  packages/backend/src/modules/notifications/validation/send-notification.dto.ts:22
  packages/backend/src/modules/notifications/validation/send-notification.dto.ts:26
  packages/backend/src/modules/billing/validation/create-payment.dto.ts:12
  packages/backend/src/modules/billing/validation/create-payment.dto.ts:16
  packages/backend/src/modules/billing/validation/create-invoice.dto.ts:12
  packages/backend/src/modules/billing/validation/create-invoice.dto.ts:15
  packages/backend/src/modules/bookings/validation/create-availability.dto.ts:4
  packages/backend/src/modules/bookings/validation/create-assignment.dto.ts:4
  packages/backend/src/modules/bookings/validation/create-assignment.dto.ts:7
  packages/backend/src/modules/clients/domain/update-client.dto.ts:26
  packages/backend/src/modules/clients/domain/create-client.dto.ts:23
  packages/backend/src/modules/services/domain/update-service.dto.ts:28
  packages/backend/src/modules/services/domain/create-service.dto.ts:24

Audit can be re-run anytime with:
rg "@IsUUID\(" packages/backend/src --type ts

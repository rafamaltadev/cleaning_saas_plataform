---
status: completed
title: "Public Scheduling Flow with Availability Sync"
type: feature
complexity: high
dependencies: [task_20]
---

# Task 21: Public Scheduling Flow with Availability Sync

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
- Phase 1 lessons learned MUST be applied — see "Phase 1 Patterns" section in each task
</context>
<execution_rules>
1. DO NOT modify, reinterpret, or optimize the task requirements
2. DO NOT skip steps or make assumptions
3. DO NOT add features not explicitly requested
4. DO NOT refactor unrelated parts of the codebase
5. DO NOT create alternative approaches
6. You MUST follow all MUST / MUST NOT rules strictly
7. You MUST implement exactly what is described — no more, no less
8. You MUST respect architecture decisions already established
9. You MUST reuse existing modules, guards, and utilities when referenced
10. You MUST NOT duplicate logic that already exists
11. You MUST apply all Phase 1 patterns documented in this task
</execution_rules>
<technical_constraints>
* Follow the current project stack and patterns strictly
* Maintain consistency with existing modules and naming conventions
* Ensure proper integration with previously implemented tasks
* Respect authentication, RBAC, and multi-tenancy rules
* Mobile-first responsive design is mandatory for all frontend work
* Security MUST be enforced on every endpoint — explicit tenant isolation, input validation, rate limiting
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
* Ensure mobile responsiveness on all UI changes (test at 375px width)
</validation>
<output_format>
* Provide only the necessary code changes
* Do not include explanations unless strictly necessary
* Keep output minimal, technical, and implementation-focused
</output_format>
Now execute the task below exactly as specified:
---

## Overview

Implements the public scheduling flow at `/t/:tenantSlug/orcamento/agendar`. After the quote is approved by the tenant/staff, the client can select a date and time slot for the service execution. The scheduling honors the tenant's general availability and locks any time slot already booked by another visitor or internal staff — visibility synchronized across the public page and the internal Kanban/calendar in real time. The first booking from a client triggers an approval modal explaining that confirmation depends on the tenant.

## Phase 1 Patterns (MUST follow)

**Backend DTO patterns:**
- For UUID validation, MUST use `@Matches(UUID_REGEX, UUID_MSG)` with constants at top of file:
  ```ts
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const UUID_MSG = { message: '$property must be a valid UUID' };
  ```
  MUST NOT use `@IsUUID()` — it rejects non-v4 UUIDs (including seed data).
- For partial updates (PUT/PATCH), every DTO field MUST be `@IsOptional()` and the service MUST check `if (dto.field !== undefined) entity.field = dto.field`.
- Service `create()` MUST assign every DTO field to the entity — never silently drop fields.
- Service `update()` MUST only trigger recalculations when a field actually changes — compare `dto.field != null && dto.field !== entity.field`.
- All new columns MUST be nullable or have defaults to avoid breaking existing data on migration.
- All `class-validator` decorators MUST permit nullable values where the entity allows null (use `@IsOptional()` plus the type validator).

**Frontend form patterns:**
- For dropdown selections (SearchableSelect), MUST use `useRef` alongside `useState`:
  ```tsx
  const fieldIdRef = useRef('');
  const [fieldId, setFieldId] = useState('');
  // onChange:
  onChange={(id) => { fieldIdRef.current = id; setFieldId(id); }}
  // in handleSubmit:
  const fid = fieldIdRef.current || fieldId;
  ```
  This prevents React closure issues where stale state is read at submit time.
- Submit button MUST be `type="button"` with `onClick={handleSubmit}` (not `type="submit"`).
- The `<form>` element MUST NOT have `onSubmit={...}` — submission is triggered exclusively by the onClick handler.
- MUST use `isSubmittingRef = useRef(false)` to prevent double submission:
  ```tsx
  if (isSubmittingRef.current) return;
  // ... validation checks ...
  isSubmittingRef.current = true;  // ONLY after validation passes
  try { ... } finally { isSubmittingRef.current = false; }
  ```
- Error message MUST be rendered immediately after the `<form>` opening tag, NOT at the bottom — bottom placement causes it to render below the fold on long forms.
- Catch blocks MUST extract backend error using dual path:
  ```tsx
  const axiosErr = err as import('axios').AxiosError<{ error?: { message?: string | string[] }; message?: string | string[] }>;
  const raw = axiosErr.response?.data;
  const msg = raw?.error?.message ?? raw?.message;
  const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro genérico. Tente novamente.');
  setError(detail);
  ```

**Mobile-first responsive patterns:**
- All layouts MUST work at 375px viewport width.
- Two-column desktop layouts MUST collapse to single column on mobile.
- Right-side summary panels MUST appear at the bottom on mobile, sticky on desktop (`lg:sticky lg:top-4`).
- Touch targets MUST be at least 44x44px.
- No horizontal scroll allowed.

**Security patterns:**
- Every controller endpoint MUST have explicit RBAC guard (`@Roles(...)`).
- Public endpoints MUST be explicitly marked `@Public()` and MUST enforce tenant isolation by tenantSlug resolution, NOT by JWT.
- Public endpoints MUST NOT expose internal IDs beyond what is necessary (tenant_id, user_id, created_by are NEVER exposed publicly).
- File uploads MUST validate MIME type and size before processing.
- Webhook endpoints MUST validate signatures before processing.
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 requests/minute per IP for unauthenticated routes).

---

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Backend

- MUST create migration `1714000000029-AlterBookingsAddPublicOrigin`:
  - `origin: varchar(20) NOT NULL DEFAULT 'internal'` (values: `'internal'`, `'public'`)
  - `approval_required: boolean NOT NULL DEFAULT false`
- MUST update Booking entity with new fields
- MUST create public endpoint `GET /api/v1/public/:tenantSlug/availability` marked with `@Public()`:
  - Accepts query params: `from: ISO date`, `to: ISO date` (max 60 days range)
  - Returns array of available slots: `[{ date: 'YYYY-MM-DD', slots: [{ start: 'HH:mm', end: 'HH:mm', available: boolean }] }]`
  - Slot granularity: 1 hour by default (configurable via tenant settings, default 60 min)
  - MUST exclude slots that have existing bookings with status IN ('confirmed', 'rescheduled', 'pending_approval')
  - MUST exclude slots outside tenant's operating hours (from existing tenant `operating_hours` field — if not configured, fallback to 08:00–18:00 Monday–Friday)
  - Rate-limited 60 req/min per IP
- MUST create new endpoint `POST /api/v1/public/:tenantSlug/bookings` — REQUIRES client-role JWT:
  - Accepts payload `{ quote_id, scheduled_start: ISO, scheduled_end: ISO, service_address?, observations? }`
  - Validates that quote_id belongs to authenticated client AND is approved (status IN ('sent', 'accepted'))
  - Validates that scheduled_start/end is in a free slot (re-checks availability atomically before insert)
  - Creates Booking with `origin='public'`, `approval_required=true`, `status='pending_approval'`
  - Triggers domain event `BookingPublicCreated` for notification dispatch (admin/staff notified for approval)
  - Returns Booking object
  - MUST use database transaction with row-level lock on overlapping bookings to prevent race conditions (two clients picking same slot)
- MUST add new booking status: `'pending_approval'` to existing enum
- MUST update VALID_TRANSITIONS in booking service:
  - `pending_approval` → `confirmed` (admin/staff approval)
  - `pending_approval` → `cancelled` (admin/staff rejection or client cancellation)
- MUST update existing GET /bookings endpoint (admin/staff) to include `origin` and `approval_required` fields
- MUST create `GET /api/v1/public/:tenantSlug/bookings/my` — REQUIRES client-role JWT:
  - Returns bookings for the authenticated client only
  - Includes status, scheduled times, service name
  - Used by client to view their own bookings

### Frontend

- MUST create new public route `/t/:tenantSlug/orcamento/agendar?quoteId={id}` accessible only to authenticated clients
- If user is not authenticated OR quoteId is missing → redirect to `/t/:tenantSlug`
- The page MUST display:
  - Header summary: quote info (service, total) — read-only
  - Calendar component (month view, mobile-first):
    - Available dates clickable
    - Past dates and dates outside operating hours disabled
    - Selected date highlighted in primary color
  - When date is selected, display time slots grid:
    - Available slots in primary color
    - Unavailable slots greyed out and disabled (with tooltip "Horário indisponível")
    - Time slots load via `GET /api/v1/public/:tenantSlug/availability?from=X&to=X`
    - Reload availability when date changes
  - Section "Local do serviço" (prefilled from quote, editable):
    - Checkbox "Executar no endereço cadastrado" (default checked, prefills from client address)
    - When unchecked, free-text address field appears
  - Section "Observações para a equipe" (textarea, optional)
- "Confirmar agendamento" CTA at bottom:
  - On first booking from this client (check client.bookings_count === 0): show modal:
    - Title: "Aguardando confirmação"
    - Body: "Seu primeiro agendamento será analisado pela empresa antes de ser confirmado. Você receberá a confirmação por e-mail em breve."
    - CTA: "Entendi, enviar agendamento"
  - On subsequent bookings: confirm directly without modal
  - Submits via POST /api/v1/public/:tenantSlug/bookings
  - On success, navigate to `/t/:tenantSlug/orcamento/confirmacao?bookingId={id}`
- MUST create confirmation page `/t/:tenantSlug/orcamento/confirmacao`:
  - Display success message
  - Show booking details (date, time, service, address)
  - Show status badge ("Aguardando confirmação")
  - Display info about next steps and contact for questions
  - CTA "Ver meus agendamentos" → client portal (placeholder for future task)
  - CTA "Voltar ao início" → `/t/:tenantSlug`
- Calendar component MUST:
  - Be touch-friendly on mobile (large tap targets)
  - Show only currently visible month with navigation arrows
  - Highlight today's date
  - Disable dates with no available slots automatically
- MUST follow ALL Phase 1 form patterns
- MUST be mobile-first responsive:
  - Calendar full-width on mobile, fixed-width on desktop
  - Time slots grid: 2 cols mobile, 4 cols desktop
  - Sticky bottom action bar on mobile with "Confirmar" CTA
  - Touch targets minimum 44x44px

### Internal App Integration (Kanban + Calendar)

- MUST update existing Kanban board (T13/T14) to show bookings with `status='pending_approval'` in a new column or badge
- Pending approval bookings MUST be visually distinct (different color, "Aguardando aprovação" label)
- MUST update existing booking detail page to show:
  - Origin field ("Público" or "Interno")
  - Approval required badge
  - "Aprovar" button for admin/staff (transitions to 'confirmed')
  - "Rejeitar" button for admin/staff (transitions to 'cancelled' with reason)
- Internal availability view MUST reflect public bookings:
  - Bookings created via public flow appear in internal Kanban/calendar immediately
  - Internal staff cannot double-book slots that are taken by public bookings (validation on Booking create)

### Security

- Availability endpoint MUST validate from/to range (max 60 days, no past dates beyond current day)
- Booking creation MUST be atomic with row-level lock to prevent double-booking race condition
- Client can only create booking for THEIR OWN quote (cross-quote injection check)
- Client can only view THEIR OWN bookings
- All operations rate-limited
- Audit log for every public booking creation, approval, and rejection

## Tests

### Backend
- GET /api/v1/public/:tenantSlug/availability returns correct slots for tenant operating hours
- GET /api/v1/public/:tenantSlug/availability excludes slots with existing confirmed/rescheduled/pending bookings
- GET /api/v1/public/:tenantSlug/availability rejects from/to range > 60 days
- GET /api/v1/public/:tenantSlug/availability respects tenant operating hours configuration
- POST /api/v1/public/:tenantSlug/bookings creates booking with origin='public', approval_required=true
- POST /api/v1/public/:tenantSlug/bookings rejects when quote belongs to different client
- POST /api/v1/public/:tenantSlug/bookings rejects when quote is not approved (status='draft' or 'rejected')
- POST /api/v1/public/:tenantSlug/bookings rejects when slot is already taken (race condition test with concurrent requests)
- POST /api/v1/public/:tenantSlug/bookings triggers BookingPublicCreated domain event
- VALID_TRANSITIONS allows pending_approval → confirmed and pending_approval → cancelled
- Admin/staff can approve booking via PUT /bookings/:id (status to confirmed)
- Internal Booking creation rejects slot already taken by public booking
- GET /api/v1/public/:tenantSlug/bookings/my returns only authenticated client's bookings
- Audit log entry created for every public booking event (create, approve, reject)

### Frontend
- /t/:tenantSlug/orcamento/agendar redirects when not authenticated
- /t/:tenantSlug/orcamento/agendar redirects when quoteId missing
- Calendar loads availability for visible month
- Time slots display correctly for selected date
- Unavailable slots are disabled and show tooltip
- First-booking modal appears for client with bookings_count === 0
- First-booking modal does NOT appear for client with bookings_count > 0
- Submitting booking navigates to confirmation page
- Confirmation page displays correct booking details
- Page renders correctly at 375px viewport width
- Bottom action bar visible on mobile with Confirmar CTA
- Pending approval bookings appear in internal Kanban with distinct styling

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000029-AlterBookingsAddPublicOrigin.ts` (new)
- `packages/backend/src/modules/bookings/domain/booking.entity.ts` (modify)
- `packages/backend/src/modules/bookings/application/booking.service.ts` (modify — VALID_TRANSITIONS, atomic slot check)
- `packages/backend/src/modules/public-bookings/public-bookings.module.ts` (new)
- `packages/backend/src/modules/public-bookings/interfaces/public-booking.controller.ts` (new)
- `packages/backend/src/modules/public-bookings/application/availability.service.ts` (new)
- `packages/backend/src/modules/public-bookings/application/public-booking.service.ts` (new)

### Frontend
- `packages/frontend/src/pages/public/PublicSchedulingPage.tsx` (new)
- `packages/frontend/src/pages/public/PublicConfirmationPage.tsx` (new)
- `packages/frontend/src/components/public/AvailabilityCalendar.tsx` (new)
- `packages/frontend/src/components/public/TimeSlotGrid.tsx` (new)
- `packages/frontend/src/components/public/FirstBookingModal.tsx` (new)
- `packages/frontend/src/api/publicBooking.ts` (new)
- `packages/frontend/src/App.tsx` (modify — add routes)
- `packages/frontend/src/pages/kanban/KanbanPage.tsx` (modify — pending approval column/badge)
- `packages/frontend/src/pages/bookings/BookingDetailPage.tsx` (modify — origin badge, approve/reject buttons)

## Definition of Done

- All migrations executed without errors
- All backend tests pass including race condition test
- All frontend tests pass
- Availability syncs in real-time between public and internal views
- First-booking modal appears only on client's first booking
- Internal Kanban shows pending approval bookings distinctly
- Renders correctly on mobile (375px), tablet (768px), desktop (1280px)
- No double-booking possible (tested with concurrent requests)

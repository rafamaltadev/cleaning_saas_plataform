---
status: pending
title: "Internationalization (i18n) with Auto-Detection (pt-BR / EN / ES)"
type: feature
complexity: medium
dependencies: [task_25]
---

# Task 26: Internationalization (i18n) with Auto-Detection (pt-BR / EN / ES)

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

Implements full internationalization with three supported locales: pt-BR (default), EN (US English), and ES (Latin American Spanish). Language is auto-detected from the user's browser settings or tenant locale configuration — NO manual user override is provided in the UI. This ensures region-appropriate content (especially for Stripe info pages, payment methods, and legal text). All UI strings, backend error messages, and email templates are translated.

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
  onChange={(id) => { fieldIdRef.current = id; setFieldId(id); }}
  const fid = fieldIdRef.current || fieldId;
  ```
- Submit button MUST be `type="button"` with `onClick={handleSubmit}` (not `type="submit"`).
- The `<form>` element MUST NOT have `onSubmit={...}`.
- MUST use `isSubmittingRef = useRef(false)` to prevent double submission.
- Error message MUST be rendered immediately after the `<form>` opening tag.
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
- Public endpoints MUST be explicitly marked `@Public()` and MUST enforce tenant isolation by tenantSlug.
- Public endpoints MUST NOT expose internal IDs.
- All input validation MUST use class-validator decorators on DTOs.
- Rate limiting MUST be applied to public endpoints (60 req/min per IP).
- Tokens with expiration MUST be single-use and invalidated after use.

---

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

---

## Requirements

### Backend — Internationalization Setup

- MUST install `nestjs-i18n` package on backend
- MUST configure I18nModule globally in `app.module.ts`:
  - Fallback language: pt-BR
  - Resolvers (in priority order):
    1. `AcceptLanguageResolver` — reads Accept-Language header
    2. `QueryResolver` (key: 'lang') — for API testing only
  - Loader: JSON files in `src/i18n/{lang}/`
- MUST create translation files for backend error messages:
  - `src/i18n/pt-BR/errors.json`
  - `src/i18n/en/errors.json`
  - `src/i18n/es/errors.json`
- MUST translate ALL existing backend error messages used in:
  - All controllers' exception messages
  - All service business rule violations
  - class-validator decorator messages (via custom validation pipe with i18n)
- Example structure:
  ```json
  {
    "auth": {
      "invalid_credentials": "Credenciais inválidas",
      "email_already_registered": "Este e-mail já está cadastrado"
    },
    "quotes": {
      "client_required": "Cliente é obrigatório",
      "service_required": "Serviço é obrigatório"
    }
  }
  ```
- MUST update existing exception classes to use I18nContext for message translation
- MUST update class-validator integration to translate constraint messages via i18n keys

### Backend — Database

- MUST create migration `1714000000044-AlterTenantsAddLocale`:
  - Adds to `tenants` table:
    - `locale varchar(5) NOT NULL DEFAULT 'pt-BR'` (values: 'pt-BR', 'en', 'es')
    - `country varchar(2) NOT NULL DEFAULT 'BR'` (values: 'BR', 'US')
    - `currency varchar(3) NOT NULL DEFAULT 'BRL'` (values: 'BRL', 'USD')
    - `timezone varchar NOT NULL DEFAULT 'America/Sao_Paulo'`
- MUST create migration `1714000000045-AlterUsersAddLocale`:
  - Adds to `users` table:
    - `locale varchar(5) nullable` (override tenant locale per user; null = inherit from tenant)
- MUST update existing email notification system to use user.locale (fallback to tenant.locale) when sending emails
- MUST translate ALL existing email templates into 3 languages:
  - Each existing template in `src/notifications/templates/` MUST have versions:
    - `template-name.pt-BR.hbs`
    - `template-name.en.hbs`
    - `template-name.es.hbs`
- MUST update EmailService to select template based on recipient locale

### Frontend — Internationalization Setup

- MUST install `react-i18next` and `i18next` packages
- MUST install `i18next-browser-languagedetector` for auto-detection
- MUST configure i18next in `src/i18n/index.ts`:
  - Fallback: pt-BR
  - Supported languages: pt-BR, en, es
  - Detection order: 1) tenant locale from JWT or context, 2) navigator language
  - NO localStorage caching of language — auto-detection runs on every load (per requirement, no manual override)
  - NO language toggle UI component
- MUST create translation files in `src/i18n/locales/`:
  - `pt-BR/common.json`, `pt-BR/auth.json`, `pt-BR/quotes.json`, `pt-BR/bookings.json`, `pt-BR/clients.json`, `pt-BR/services.json`, `pt-BR/settings.json`, `pt-BR/billing.json`, `pt-BR/public.json`
  - Mirror structure for `en/` and `es/`
- MUST extract ALL existing hardcoded UI strings into translation files
- MUST wrap all UI text in `t()` calls or `<Trans>` components
- MUST use plural-aware translations where applicable (e.g. "1 cliente" vs "2 clientes")

### Frontend — Locale Detection Logic

- On app initialization:
  1. If authenticated: use user.locale (from JWT/profile)
  2. If not authenticated: use navigator.language
  3. Map browser locale to supported language:
     - `pt-*` → `pt-BR`
     - `en-*` → `en`
     - `es-*` → `es`
     - Other → `pt-BR` (fallback)
- MUST set `<html lang="">` attribute dynamically based on detected language
- MUST format dates, numbers, and currencies according to locale:
  - pt-BR: 14/05/2026, R$ 1.234,56
  - en: 05/14/2026, $1,234.56
  - es: 14/05/2026, $ 1.234,56
- MUST use `Intl.DateTimeFormat` and `Intl.NumberFormat` consistently

### Frontend — Tenant Locale Configuration

- MUST add locale, country, currency, timezone fields to existing Tenant configuration page (Settings → Empresa)
- Locale select: pt-BR, en, es
- Country select: BR, US
- Currency: auto-derived from country (BRL for BR, USD for US) — read-only
- Timezone: select from common timezones list, filtered by country
- When tenant updates locale, the change applies to all users in the tenant who don't have personal locale override

### Email Templates — Translation Requirements

- Each existing email template MUST be translated into pt-BR, EN, ES:
  - welcome.hbs
  - password-reset.hbs (from T27)
  - email-verification.hbs (from T28)
  - quote-created.hbs
  - quote-approved.hbs
  - booking-confirmed.hbs
  - booking-cancelled.hbs
  - payment-link-prepaid.hbs (from T24)
  - payment-link-postpaid.hbs (from T24)
  - payment-success.hbs (from T24)
  - payment-failed.hbs (from T24)
  - payment-refund.hbs (from T24)
  - subscription-price-change.hbs (from T22)
- Template selection logic: `template-name.{locale}.hbs` with fallback to pt-BR

### Security

- Auto-detection MUST NOT trust client-supplied locale headers blindly — server-side validates against supported list
- Translation keys MUST be referenced by code, never by user input (prevent injection)
- Email content MUST be sanitized regardless of locale

## Tests

### Backend
- Accept-Language: pt-BR returns Portuguese error messages
- Accept-Language: en-US returns English error messages
- Accept-Language: es-AR returns Spanish error messages
- Unsupported language (fr, de, etc.) falls back to pt-BR
- Email template selection respects user.locale, falls back to tenant.locale
- Email template selection falls back to pt-BR when locale not configured
- class-validator messages translated correctly via i18n pipe

### Frontend
- App initializes in pt-BR for Brazilian browsers
- App initializes in en for US English browsers
- App initializes in es for Spanish browsers
- Unsupported browser language falls back to pt-BR
- Authenticated user's locale overrides browser detection
- `<html lang="">` attribute updated dynamically
- Date formatting respects locale (test pt-BR vs en formatting)
- Number formatting respects locale (test currency display)
- All major pages have no hardcoded strings (i18n coverage scan)
- Plural forms work correctly (e.g. "0 clientes", "1 cliente", "2 clientes")

## Implementation Files

### Backend
- `packages/backend/src/database/migrations/1714000000044-AlterTenantsAddLocale.ts` (new)
- `packages/backend/src/database/migrations/1714000000045-AlterUsersAddLocale.ts` (new)
- `packages/backend/src/i18n/pt-BR/errors.json` (new)
- `packages/backend/src/i18n/en/errors.json` (new)
- `packages/backend/src/i18n/es/errors.json` (new)
- `packages/backend/src/common/i18n/i18n.module.ts` (new)
- `packages/backend/src/common/i18n/i18n-validation.pipe.ts` (new)
- `packages/backend/src/modules/tenants/domain/tenant.entity.ts` (modify)
- `packages/backend/src/modules/users/domain/user.entity.ts` (modify)
- `packages/backend/src/modules/notifications/email.service.ts` (modify — locale-aware template selection)
- `packages/backend/src/notifications/templates/**/*.{pt-BR,en,es}.hbs` (new — all email templates × 3 languages)
- ALL existing exception throws — replace hardcoded strings with i18n keys

### Frontend
- `packages/frontend/src/i18n/index.ts` (new — i18next config)
- `packages/frontend/src/i18n/locales/pt-BR/*.json` (new — 9 namespace files)
- `packages/frontend/src/i18n/locales/en/*.json` (new — 9 namespace files)
- `packages/frontend/src/i18n/locales/es/*.json` (new — 9 namespace files)
- `packages/frontend/src/utils/formatters.ts` (new — locale-aware date, number, currency formatters)
- `packages/frontend/src/pages/settings/sections/CompanyProfileSection.tsx` (modify — locale fields)
- `packages/frontend/src/main.tsx` (modify — import i18n config)
- ALL existing components with hardcoded strings — wrap in t()

## Definition of Done

- All migrations executed without errors
- All existing tenants default to pt-BR locale
- All backend tests pass
- All frontend tests pass
- All UI strings translated into 3 languages
- All email templates translated into 3 languages
- Auto-detection works correctly
- No language toggle UI present
- Date/number/currency formatting locale-aware
- All pages render correctly on mobile (375px), tablet, desktop in all 3 languages

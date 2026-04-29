---
status: pending
title: "Public Landing Page & Subscriber Login"
type: feature
complexity: high
dependencies: [task_14]
---

# Task 15: Public Landing Page & Subscriber Login

---
You are a senior software engineer executing a predefined task in an existing codebase.
Your objective is to implement the task EXACTLY as specified.
<context>
- The project follows a strict sequential task system
- All dependencies listed in the task are already implemented
- You MUST trust the task specification as the single source of truth
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
</execution_rules>
<technical_constraints>
* Follow the current project stack and patterns strictly
* Maintain consistency with existing modules and naming conventions
* Ensure proper integration with previously implemented tasks
* Respect authentication, RBAC, and multi-tenancy rules
</technical_constraints>
<validation>
* Ensure all requirements are fully implemented
* Ensure no security rules are violated
* Ensure tenant isolation is preserved
* Ensure correct error handling (401, 403, 400, 500)
</validation>
<output_format>
* Provide only the necessary code changes
* Do not include explanations unless strictly necessary
* Keep output minimal, technical, and implementation-focused
</output_format>
Now execute the task below exactly as specified:
---

## Design System Reference

MUST read and follow `.compozy/tasks/cleaning-saas/_design_system.md` before writing any frontend code.
All UI MUST conform strictly to the design system defined there — colors, typography, spacing, components, responsiveness, and screen patterns.

## Overview

Implements the public-facing landing page (conversion-optimized sales page) and the subscriber login entry point. This is a standalone public route — unauthenticated users land here. Authenticated users are redirected to the dashboard. No backend changes in this task.

<critical>
- ALWAYS READ the design system reference before starting
- This is a CONVERSION ENGINE — every section must justify its existence and drive action
- ALL copy and pricing MUST match exactly what is specified below — DO NOT change prices, rename plans, or invent features
- MUST be mobile-first and fully responsive
- TESTS REQUIRED — every deliverable MUST include tests
</critical>

<requirements>

### Route Structure
- MUST be accessible at the public root route (e.g., `/` or `/landing`)
- Authenticated users visiting this route MUST be redirected to the dashboard
- The subscriber login button/link MUST route to the existing auth login screen (implemented in T13)
- No new auth logic — reuse the auth flow from T13

### Landing Page Structure (MANDATORY — implement all sections in this order)

#### 1. Hero (Above the Fold)
- Strong, outcome-driven headline focused on results for cleaning business owners
- Clear subheadline: what the platform does + who it's for + the key result
- Primary CTA button: "Start Free" (or equivalent in pt-BR: "Começar Grátis")
- Secondary CTA button: "See Demo" (or equivalent: "Ver Demonstração")
- Product preview mockup or screenshot placeholder

#### 2. Social Proof
- Metrics section (e.g., bookings created, quotes sent, time saved) — use plausible placeholder numbers
- Optional: logo strip or testimonial cards with placeholder content

#### 3. Problem → Solution
- Highlight three real pain points:
  1. Missed leads and lost clients
  2. Manual and disorganized operations
  3. Too much time on admin, not enough on service delivery
- Immediately connect each pain point to a solution the platform provides

#### 4. Features (Value-Driven)
- Focus on outcomes, not technical details:
  1. Automate client communication
  2. Manage quotes and bookings in one place
  3. Organize your team and schedule
  4. Centralize operations and reporting

#### 5. How It Works
- 3 simple steps (visual, scannable):
  1. Create your account and set up your services
  2. Send quotes and confirm bookings
  3. Manage your team and track everything in real time

#### 6. Benefits / Differentials
- Save hours of manual work every week
- Never miss a lead or lose a booking
- Run your entire operation from your phone

#### 7. Pricing (STRICT — DO NOT MODIFY)

Display pricing based on user region:
- If browser locale is pt-BR → show BRL pricing
- If locale is unknown or not pt-BR → show toggle (BRL / USD) defaulting to USD
- Highlight "Growth" as MOST POPULAR with visual badge and scaled card
- Highlight "Scale" as BEST VALUE with visual badge

**Brazil (pt-BR)**

| Plan | Price | Description | Features |
|---|---|---|---|
| Starter | R$ 59,90/mês | Ideal para quem está começando | Uso individual, Página pública + agendamento, Gestão básica |
| Growth ⭐ Most Popular | R$ 249,90 / 6 meses | Para organizar e crescer | Até 3 membros na equipe, Agenda completa, Gestão de leads |
| Scale 🏆 Best Value | R$ 399,90 / ano | Para escalar sua operação | Até 10 membros na equipe, Acesso completo à plataforma, Suporte prioritário |

**International (en-US)**

| Plan | Price | Description | Features |
|---|---|---|---|
| Starter | $19.90/month | For getting started | Single user, Public page + scheduling, Basic management |
| Growth ⭐ Most Popular | $79.90 / 6 months | For growing operations | Up to 3 team members, Full scheduling, Lead management |
| Scale 🏆 Best Value | $149.90 / year | For scaling | Up to 10 team members, Full platform access, Priority support |

Pricing UI requirements:
- 3 pricing cards side-by-side (stacked on mobile)
- Middle card (Growth) visually emphasized: scaled up, distinct border, "Most Popular" badge
- Scale card: "Best Value" badge
- Each card MUST include a CTA button
- Microcopy below cards: "Cancel anytime" and "No credit card required"
- DO NOT focus copy on price — reinforce time saved, automation power, revenue impact

#### 8. Live Simulation Section
- Animated or visually dynamic section showing:
  1. A quote being created and sent to a client
  2. A booking being confirmed
  3. A notification being dispatched automatically
- MUST feel real and dynamic — use CSS animations or simple state transitions, not static screenshots

#### 9. Final CTA
- Strong repetition of the primary CTA ("Start Free")
- Reinforce the core value proposition
- Remove friction: no credit card required, cancel anytime

### Subscriber Login Entry
- Persistent "Log in" link in the page header/navigation
- Routes to the existing login screen from T13
- No new auth implementation

### Copy Rules
- Direct and benefit-driven
- Clear and simple — no buzzwords
- Every section must drive conversion
- Short sections — highly scannable

### Forbidden
- DO NOT change prices
- DO NOT rename plans
- DO NOT invent features
- DO NOT add unnecessary complexity
- No backend changes in this task

</requirements>

## Subtasks

- [ ] 15.1 Implement page route structure and redirect logic for authenticated users
- [ ] 15.2 Implement Hero section with primary and secondary CTAs
- [ ] 15.3 Implement Social Proof section
- [ ] 15.4 Implement Problem → Solution section
- [ ] 15.5 Implement Features section
- [ ] 15.6 Implement How It Works section
- [ ] 15.7 Implement Benefits section
- [ ] 15.8 Implement Pricing section with region detection and currency toggle
- [ ] 15.9 Implement Live Simulation section with animations
- [ ] 15.10 Implement Final CTA section
- [ ] 15.11 Implement persistent header with Log In link

## Deliverables

- Public landing page accessible at root route
- All 9 sections implemented in the specified order
- Pricing with exact plans, prices, and copy as specified — no deviations
- Region-based currency detection with BRL/USD toggle
- Live simulation section with animations
- Subscriber login link routing to T13 login screen
- Authenticated user redirect to dashboard
- Mobile-first, fully responsive across all breakpoints
- Unit and component tests (REQUIRED)

## Tests

- [ ] Authenticated user visiting the landing page is redirected to the dashboard
- [ ] Unauthenticated user sees the full landing page
- [ ] Pricing section displays BRL prices when locale is pt-BR
- [ ] Pricing section displays USD prices as default for unknown locale
- [ ] Currency toggle switches between BRL and USD correctly
- [ ] Growth plan card is visually distinct and carries "Most Popular" badge
- [ ] Scale plan card carries "Best Value" badge
- [ ] All three pricing cards include a CTA button
- [ ] Log in link routes to the login screen
- [ ] Primary CTA "Start Free" is present and visible in Hero and Final CTA sections
- [ ] Live simulation section renders without errors

## Success Criteria

- All tests passing
- Full landing page renders correctly on mobile, tablet, and desktop
- Pricing is EXACTLY as specified — no price changes, no plan renames, no invented features
- All sections present and in the specified order
- Design system followed strictly throughout
- No backend changes were made

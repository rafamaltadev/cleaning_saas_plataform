# ADR-002: Monolithic Modular Architecture with Logical Multi-Tenant Isolation and JWT RBAC

## Status

Accepted

## Date

2026-04-24

## Context

The Cleaning SaaS Platform must support multi-tenant tenancy, a SPA frontend, and a manageable implementation for the initial launch. The architecture should enable clear domain boundaries and later evolution without introducing excessive early complexity.

## Decision

Use a monolithic modular backend built with Node.js and TypeScript, structured as domain modules. Implement logical tenant isolation in a shared PostgreSQL database using `tenant_id` on scoped tables. Use JWT-based authentication with short-lived access tokens, refresh tokens, and RBAC claims containing `tenant_id` and user roles.

## Alternatives Considered

### Alternative 1: Monolith with Express

- **Description**: Use Express.js with manual folder structure and middleware.
- **Pros**: Minimal dependencies, simpler for small teams.
- **Cons**: Less modular structure, more boilerplate for domain separation.
- **Why rejected**: NestJS delivers structured modules and dependency injection without sacrificing a monolithic deployment.

### Alternative 2: Microservices

- **Description**: Split services into independent backend services behind an API gateway.
- **Pros**: Independent scaling, clear service boundaries.
- **Cons**: Higher implementation complexity, more operational overhead.
- **Why rejected**: Too complex for initial launch and MVP-focused implementation.

### Alternative 3: Session-based authentication

- **Description**: Use server-side sessions with cookie-based auth.
- **Pros**: Simpler token revocation, familiar security model.
- **Cons**: Harder to scale for SPA and cross-origin clients.
- **Why rejected**: JWT with refresh tokens matches SPA requirements and fits multi-tenant API access.

## Consequences

### Positive

- Faster initial implementation with explicit domain modules.
- Clear path to evolve into service extraction later.
- SPA-friendly auth architecture with tenant-aware claims.

### Negative

- Single deployment unit may require stronger runtime observability and scaling planning.
- Logical tenant isolation demands careful query and middleware discipline.
- Refresh token management adds state and security requirements.

### Risks

- Risk of tenant data leakage if `tenant_id` is omitted from queries. Mitigation: enforce global tenant middleware and repository base filters.
- Risk of stale refresh tokens. Mitigation: use rotating refresh tokens and persistent revocation storage.

## Implementation Notes

- Use NestJS modules for each domain: auth, tenants, quotes, bookings, clients, billing, notifications, analytics.
- Store tenant-specific state in `tenant_id`-scoped tables and validate requests at the service boundary.
- Issue JWT access tokens valid for 15 minutes and refresh tokens valid for 30 days.
- Store refresh tokens in a secure store and revoke on logout.
- Frontend remains React + TypeScript consuming the API.

# Cleaning SaaS Platform PRD

## Overview

### Product Vision
To become the leading SaaS platform that empowers cleaning companies of all sizes to transform their operations from manual, inefficient processes into scalable, professional businesses, enabling them to capture more clients, deliver better service, and grow revenue predictably.

### Business Problem
Cleaning companies face significant operational inefficiencies and revenue leakage due to reliance on manual processes: WhatsApp communications, phone calls, spreadsheets for tracking, and inconsistent pricing. This leads to:
- Lost sales opportunities from slow responses and quote abandonment
- Operational errors in scheduling and service delivery
- Inability to scale without proportional cost increases
- Poor customer experience and retention
- Lack of business insights and performance tracking

### Value Proposition
The Cleaning SaaS Platform provides a complete, automated solution that:
- Increases quote-to-booking conversion by 30% through instant, professional quotes
- Reduces operational costs by automating scheduling, communication, and team management
- Improves customer satisfaction with reliable, branded service experiences
- Enables data-driven growth with comprehensive metrics and analytics
- Supports business scaling through multi-tenant architecture and white-label customization

## Goals

- **Revenue Impact**: Achieve 30% improvement in quote conversion rates and establish MRR growth with <5% churn
- **Operational Efficiency**: Reduce average response time from days to hours and operational error rate by 40%
- **Customer Satisfaction**: Maintain NPS >70 and recurrence rate >50%
- **Scalability**: Support 100+ tenants within 12 months with 99.9% uptime
- **Timeline**: Full-featured launch within 12 months
- **Compliance**: Full adherence to LGPD, GDPR, and data privacy standards

## User Stories

### Primary Persona: Small Cleaning Company Owner (1-10 employees)
- As a small business owner, I want simple price configuration so that I can set competitive rates without complex calculations
- As an owner, I want automatic quote generation so that I don't lose potential clients waiting for manual responses
- As an owner, I want integrated scheduling so that I can manage my team's workload efficiently

### Primary Persona: Medium Cleaning Company Manager (10-50 employees)
- As a manager, I want CRM capabilities so that I can track client history and preferences
- As a manager, I want communication automation so that I reduce administrative overhead
- As a manager, I want performance metrics so that I can optimize operations and identify growth opportunities

### Primary Persona: Large Cleaning Company Executive (50+ employees)
- As an executive, I want white-label branding so that the platform integrates seamlessly with our corporate identity
- As an executive, I want comprehensive analytics so that I can make data-driven strategic decisions
- As an executive, I want multi-user access control so that I can delegate responsibilities securely

### Secondary Persona: Service Staff
- As staff, I want mobile-accessible task assignments so that I can check schedules on-the-go
- As staff, I want automated notifications so that I stay updated on assignments and changes

### Secondary Persona: End Customer
- As a customer, I want easy online quote requests so that I can get cleaning services quickly
- As a customer, I want transparent pricing and scheduling so that I know what to expect

## Core Features

### 1. Price Configuration Module
**Objective**: Enable tenants to define flexible pricing structures for their services.

**Main Functionalities**:
- Service type definitions (residential, commercial, deep cleaning, etc.)
- Pricing rules based on area, frequency, and add-ons
- Dynamic pricing adjustments
- Currency support (USD, BRL) with automatic conversion

**Data Inputs**: Service parameters, base rates, markup percentages
**Data Outputs**: Calculated prices, quote totals
**Business Rules**: Minimum/maximum price validation (min R$30, max R$5000 per service), currency conversion rates
**Dependencies**: Used by Quote Generation module

### 2. Automatic Quote Generation Module
**Objective**: Generate professional, instant quotes to improve response time and conversion.

**Main Functionalities**:
- Client input form for service requests
- Automatic price calculation based on configuration
- PDF quote generation with branding
- Email delivery of quotes

**Data Inputs**: Client details, service specifications
**Data Outputs**: Formatted quotes, delivery confirmations
**Business Rules**:
- Price calculation: Base price = (area in m² * rate per m²) + add-ons + frequency discount (10% for weekly, 15% for monthly). Minimum quote value: R$50 (BRL) or $10 (USD).
- Quote validity: 7 days from generation. Automatic expiration notification sent 24h before expiry.
- Manual adjustments: Tenants can apply up to 20% discount or markup via admin panel, with audit log. No adjustments allowed after client acceptance.
- Currency conversion: Real-time rates from external API (e.g., fixer.io), with 2% fee for non-base currency.
**Dependencies**: Relies on Price Configuration, integrates with Scheduling

### 3. Scheduling Management Module
**Objective**: Streamline booking and resource allocation.

**Main Functionalities**:
- Calendar-based scheduling interface
- Team availability management
- Automated booking confirmations
- Conflict detection and resolution

**Data Inputs**: Service requests, team schedules, client preferences
**Data Outputs**: Confirmed bookings, staff assignments
**Business Rules**:
- Buffer times: Minimum 30 minutes between services for the same team to allow travel/cleanup.
- Geographic constraints: Teams assigned within 50km radius; if no team available, notify client for alternative dates.
- Conflict resolution: Automatic detection; if conflict, system suggests next available slot or notifies tenant for manual override.
- Prioritization: VIP clients (based on history >5 services) get priority booking within 24h.
**Dependencies**: Uses Quote data, feeds into Communication Automation

### 4. User Management (CRM) Module
**Objective**: Provide basic customer relationship management.

**Main Functionalities**:
- Client profile management
- Service history tracking
- Contact information storage
- Basic segmentation and filtering

**Data Inputs**: Client data from quotes and bookings
**Data Outputs**: Client reports, history summaries
**Business Rules**: Data retention policies, consent management
**Dependencies**: Integrated with all service modules

### 5. Communication Automation Module
**Objective**: Automate client and staff communications.

**Main Functionalities**:
- Email/SMS templates for different events
- Automated triggers (quote sent, booking confirmed, service completed)
- Multi-language support (PT-BR, EN, ES)
- Delivery tracking and status updates

**Data Inputs**: Event triggers, client contact info
**Data Outputs**: Communication logs, delivery statuses
**Business Rules**: Opt-in requirements, frequency limits
**Dependencies**: Triggered by Scheduling and Quote modules

### 6. Metrics and Analytics Module
**Objective**: Provide actionable business insights.

**Main Functionalities**:
- Dashboard with key metrics
- Revenue and service volume tracking
- Conversion funnel analysis
- Custom report generation

**Data Inputs**: All system transaction data
**Data Outputs**: Charts, reports, KPIs
**Business Rules**: Data aggregation periods, privacy filtering
**Dependencies**: Consumes data from all modules

### 7. White-Label Branding Module
**Objective**: Allow tenants to customize the platform appearance.

**Main Functionalities**:
- Logo and color scheme customization
- Branded email templates
- Tenant-specific UI elements

**Data Inputs**: Branding assets, color settings
**Data Outputs**: Customized interfaces
**Business Rules**: Asset format requirements (PNG/JPG <2MB), color validation
**Dependencies**: Applied across all user-facing modules

## User Experience

### Detailed User Journey

#### Phase 1: Client Acquisition
1. Potential client discovers tenant through branded website or referral
2. Client accesses quote request form
3. System collects service details (type, location, frequency, contact info)
4. Instant quote generated and delivered via email

#### Phase 2: Booking and Preparation
1. Client reviews quote and initiates booking
2. System checks availability and proposes time slots
3. Client selects preferred time and confirms booking
4. Automated confirmation sent to client and assigned staff

#### Phase 3: Service Execution
1. Staff receives assignment notification with client details
2. Staff arrives and completes service
3. System tracks service completion
4. Client receives satisfaction survey

#### Phase 4: Post-Service and Retention
1. Automated follow-up communication
2. Recurrence suggestions based on service history
3. Metrics updated for tenant dashboard
4. Feedback incorporated into service improvements

### UI/UX Considerations
- Clean, professional interface suitable for B2B users
- Mobile-optimized for staff access
- Intuitive navigation with clear call-to-actions
- Consistent branding across all touchpoints
- Accessibility compliance (WCAG 2.1 AA)
- Progressive disclosure to avoid overwhelming users

## Cenários de Exceção

### Abandono de Orçamento
- **Cenário**: Cliente solicita orçamento mas não responde dentro de 7 dias.
- **Tratamento**: Sistema envia lembrete automático após 48h e 6 dias. Após expiração, orçamento é arquivado; tenant pode reativar manualmente para follow-up.
- **Objetivo**: Recuperar 20% dos orçamentos abandonados via reengajamento.

### Conflitos de Agenda
- **Cenário**: Duas solicitações para mesmo horário/local.
- **Tratamento**: Sistema detecta conflito, notifica tenant, sugere alternativas automáticas (próximo slot disponível). Tenant pode sobrescrever ou cancelar.
- **Objetivo**: Resolver 95% dos conflitos sem intervenção manual.

### Cancelamentos e No-Show
- **Cenário**: Cliente cancela <24h antes ou não comparece.
- **Tratamento**: Cancelamento: Reembolso de 50% se <24h; no-show: cobrança de taxa de R$50 + reagendamento automático. Notificação imediata à equipe.
- **Objetivo**: Minimizar perdas operacionais e educar clientes.

### Atrasos Operacionais
- **Cenário**: Equipe atrasa >15min.
- **Tratamento**: Notificação automática ao cliente com novo ETA. Se >1h, oferta desconto de 10% no próximo serviço. Log de incidentes para análise.
- **Objetivo**: Manter satisfação >80% em casos de atraso.

## High-Level Technical Constraints

- **Multi-Tenant Architecture**: Complete data isolation between tenants with shared infrastructure
- **Internationalization**: Full i18n support for PT-BR, EN, ES with locale-specific formatting
- **Multi-Currency**: Support for USD and BRL with real-time conversion
- **Scalability**: Support for 1000+ concurrent users and 10,000+ tenants
- **Performance**: <2 second response times for quote generation, <5 second page loads
- **Security**: SOC 2 compliance, encrypted data storage, secure API access
- **Compliance**: LGPD and GDPR compliance with data portability and deletion capabilities
- **Integrations**: RESTful APIs for future third-party integrations

## Non-Goals (Out of Scope)

- **Payment Processing**: Direct payment collection (integrate with Stripe/PayPal)
- **Advanced CRM**: Marketing automation, lead scoring, or sales pipeline management
- **Mobile Apps**: Native iOS/Android apps (web-responsive only)
- **Advanced Scheduling**: Resource optimization algorithms or AI-based matching
- **Third-Party Integrations**: Direct connections to accounting software or existing CRMs
- **Offline Functionality**: Service execution without internet connectivity
- **Advanced Analytics**: Predictive analytics or machine learning insights
- **Multi-Company Management**: Support for franchises or multi-location businesses
- **Dynamic Pricing**: Automated price adjustments based on demand (deferred to Phase 3)
- **Custom Domain in White-Label**: Full custom domain support (basic branding in Phase 1, advanced in Phase 3)

## Phased Rollout Plan

### Phase 1: Core Platform Launch (Months 1-6)
- Price Configuration, Quote Generation, Scheduling, Basic CRM
- Success Criteria: 20 beta tenants, 25% conversion rate, <24hr response time

### Phase 2: Enhancement Release (Months 7-9)
- Communication Automation, Metrics Dashboard, Basic White-Label Branding
- Success Criteria: 50 paying tenants, 35% conversion rate, NPS >75

### Phase 3: Scale and Optimization (Months 10-12)
- Performance optimization, advanced features (dynamic pricing, full white-label), full compliance
- Success Criteria: 100+ tenants, MRR $50K+, churn <3%

## Success Metrics

- **Quote Conversion Rate**: Target 35% (quotes to bookings)
- **Average Response Time**: Target <4 hours
- **Booking Completion Rate**: Target 95%
- **Customer Retention Rate**: Target 60% (repeat bookings)
- **Platform Engagement**: Target 80% of tenants using >5 features weekly
- **MRR Growth**: Target 20% month-over-month
- **Churn Rate**: Target <5%
- **NPS**: Target >70
- **System Uptime**: Target 99.9%
- **Data Accuracy**: Target 99.5% (error-free transactions)

## Risks and Mitigations

### Technical Risks
- **Scalability Challenges**: Multi-tenant load balancing issues
  - Mitigation: Cloud-native architecture with auto-scaling
- **Integration Complexity**: Module interdependencies causing bugs
  - Mitigation: Comprehensive integration testing and modular design
- **Data Security Breaches**: Sensitive client information exposure
  - Mitigation: End-to-end encryption, regular security audits

### Operational Risks
- **Development Delays**: Full scope causing timeline slippage
  - Mitigation: Agile development with 2-week sprints, regular demos
- **Cost Overruns**: Unexpected complexity increasing budget
  - Mitigation: Fixed-scope contracts, monthly budget reviews
- **Resource Constraints**: Difficulty hiring specialized talent
  - Mitigation: Partner with experienced SaaS development firms

### User Adoption Risks
- **Resistance to Change**: Tenants accustomed to manual processes
  - Mitigation: Comprehensive onboarding, success coaching, case studies
- **Learning Curve**: Complex interface overwhelming small businesses
  - Mitigation: Simplified UI, video tutorials, 24/7 support
- **Competition**: Existing solutions capturing market share
  - Mitigation: Unique value proposition focus, early mover advantage

## Architecture Decision Records

- [ADR-001: Full-Featured Launch Approach](.compozy/tasks/cleaning-saas/adrs/adr-001-full-featured-launch.md) — Decision to develop and launch all features simultaneously for comprehensive value delivery.

## Acceptance Criteria

### Price Configuration
- Given a tenant configures rates, when a service is requested, then prices are calculated accurately within <1s.
- Given invalid rates (below min), then system prevents saving and shows error.

### Automatic Quote Generation
- Given client submits form, when all fields valid, then PDF quote is emailed within <5s.
- Given expired quote, then system prevents booking and notifies client.

### Scheduling Management
- Given booking request, when slot available, then confirmation is sent automatically.
- Given conflict detected, then system suggests alternative and logs for tenant review.

### User Management (CRM)
- Given new client, when service completed, then history is updated and accessible.
- Given search query, then results filter by name/location within <2s.

### Communication Automation
- Given booking confirmed, then SMS/email is sent in client's language within <1min.
- Given opt-out, then no communications are sent.

### Metrics and Analytics
- Given dashboard access, then key metrics display real-time data.
- Given export request, then CSV/PDF is generated within <10s.

### White-Label Branding
- Given logo uploaded, when client views quote, then branding appears correctly.
- Given invalid asset, then upload fails with clear error message.

## Open Questions

- Specific subscription pricing tiers and feature bundles
- Preferred cloud provider and infrastructure setup
- Detailed LGPD compliance implementation requirements
- Integration with popular Brazilian payment processors
- Support for additional languages beyond PT-BR, EN, ES
# SaaS Roadmap (Source of Truth)
## Document Version
- Current release: v0.3.0
- Last updated: 2026-04-06


## Status legend
- `DONE` = implementeret og verificeret i kodebase.
- `IN PROGRESS` = delvist implementeret.
- `TODO` = ikke startet.

## How to use this file
- Reference work by ID in prompts, e.g. `TASK-2.3`.
- Always include this path when assigning work: `docs/saas-roadmap.md`.
- Prompt format:
  - `Implement TASK-2.3 from docs/saas-roadmap.md. Backend only. Include tests.`

---

## EPIC-1 Multi-tenant Foundation
**Goal:** Isolate all customer data by organization.

### TASK-1.1 Prisma multi-tenant schema
**Status:** `DONE`
- Add models: `Organization`, `OrganizationUser`, `Subscription` (minimum for MVP).
- Add `organizationId` to: `Embed`, `Group`, `Variant`, `AuditLog`.
- Add indexes on `organizationId`.
- Add organization-scoped unique constraints where needed.
- **Acceptance criteria:**
  - Migration applies cleanly.
  - Existing data is migrated or backfilled safely.
  - No table with customer data is missing `organizationId`.

### TASK-1.2 Tenant context service
**Status:** `DONE`
- Create a shared helper: `getCurrentOrgContext()`.
- Resolve active org + membership role from session.
- Return `{ orgId, role, userId }`.
- **Acceptance criteria:**
  - Helper used by API routes and server actions.
  - Request without valid org context is rejected.

### TASK-1.3 Tenant-safe queries
**Status:** `DONE`
- Refactor all data access to include `organizationId`.
- Remove non-scoped reads/writes.
- **Acceptance criteria:**
  - Cross-tenant access is impossible via API.
  - Tests cover tenant isolation.

### TASK-1.4 RBAC policy
**Status:** `DONE`
- Standard roles: `owner`, `admin`, `editor`, `viewer`.
- Add policy helpers:
  - `canManageBilling`
  - `canManageMembers`
  - `canEditContent`
  - `canViewContent`
- **Acceptance criteria:**
  - Write routes enforce role policies.
  - Member/billing routes restricted to allowed roles.

---

## EPIC-2 Billing and Plan Enforcement
**Goal:** Customers can buy access and be limited by plan.

### TASK-2.1 Stripe checkout integration
**Status:** `DONE`
- Add endpoint to create Stripe Checkout Session.
- Map selected plan to Stripe price ID.
- **Acceptance criteria:**
  - User can start checkout from app/marketing flow.
  - Successful checkout returns to app.

### TASK-2.2 Stripe customer portal
**Status:** `DONE`
- Add endpoint for Billing Portal session.
- **Acceptance criteria:**
  - Customer can manage subscription and payment method.

### TASK-2.3 Stripe webhook sync
**Status:** `DONE`
- Add webhook route with signature validation.
- Handle:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Sync local `Subscription` record.
- **Acceptance criteria:**
  - Subscription status in DB matches Stripe after events.
  - Webhook idempotency is handled.

### TASK-2.4 Plan limits enforcement
**Status:** `DONE`
- Define limits per plan (projects, variants, seats, etc.).
- Enforce limits in backend create/update flows.
- Return upgrade-required responses when over limit.
- **Acceptance criteria:**
  - Limits are enforced server-side (not UI only).
  - Attempts above limit are blocked with clear error.

---

## EPIC-3 Customer Workspace UX
**Goal:** Make the customer area production-ready and intuitive.

### TASK-3.1 Onboarding flow
**Status:** `DONE`
- Steps:
  - Create workspace
  - Create first project
  - Upload first variant
  - Copy embed code
- **Acceptance criteria:**
  - New customer can complete first value flow without docs.

### TASK-3.2 Dashboard and navigation IA
**Status:** `DONE`
- Core sections:
  - Dashboard
  - Projects
  - Team
  - Domains
  - Billing
  - Audit
- **Acceptance criteria:**
  - Navigation reflects permissions and plan.
  - Key metrics visible on dashboard.

### TASK-3.3 Usage and upgrade UX
**Status:** `DONE`
- Show usage vs plan limits.
- Add upgrade prompts at limit boundaries.
- **Acceptance criteria:**
  - Customer can see why an action is blocked.
  - Upgrade path is one click from blocked action.

---

## EPIC-4 Marketing and Purchase Flow
**Goal:** Convert visitors to paying customers.

### TASK-4.1 Marketing pages
**Status:** `DONE`
- Create: Landing, Pricing, FAQ, Contact.
- **Acceptance criteria:**
  - Pricing page is connected to checkout.

### TASK-4.2 Signup and workspace setup
**Status:** `DONE`
- Flow: signup -> verify -> workspace setup -> trial/checkout.
- **Acceptance criteria:**
  - End-to-end acquisition flow works from public site.

---

## EPIC-5 Security, Reliability, and Observability
**Goal:** Operate safely at SaaS level.

### TASK-5.1 Webhook hardening
**Status:** `DONE`
- Validate signatures for Stripe and Mux.
- Add idempotency/replay protection.
- **Acceptance criteria:**
  - Unsigned/invalid webhooks are rejected.

### TASK-5.2 Rate limiting and abuse protection
**Status:** `DONE`
- Add limits for auth, uploads, and write-heavy routes.
- **Acceptance criteria:**
  - Excessive requests are throttled predictably.

### TASK-5.3 Observability
**Status:** `DONE`
- Add Sentry (frontend + backend).
- Structured logs with request correlation ID.
- **Acceptance criteria:**
  - Runtime errors are traceable with context.

### TASK-5.4 Test strategy
**Status:** `IN PROGRESS`
- Add E2E (signup/checkout/upload/embed).
- Add API tests (tenant isolation + RBAC + limits).
- **Acceptance criteria:**
  - CI enforces lint + typecheck + tests + build.
- Progress note:
  - `DONE`: CI koerer allerede lint, typecheck, unit/API tests, E2E smoke og build.
  - `DONE`: API contract tests daekker tenant isolation, RBAC, plan-limits og branding guardrails.
  - `DONE`: Full lokal acquisition/content E2E daekker signup, workspace setup, billing fixture, projekt, variant og embed.
  - `IN PROGRESS`: Ekstern hosted checkout og rigtig Mux-upload mangler stadig et dedikeret testmiljoe uden for standard-CI.

---

## EPIC-6 AI Support Chatbot (Future)
**Goal:** Give customers instant self-service answers and collect qualified leads/support requests.
**Priority:** `LATER` (ikke nu)

### TASK-6.1 Chatbot scope and guardrails
**Status:** `DONE`
- Define allowed topics (product, pricing, setup, troubleshooting).
- Define out-of-scope and escalation triggers to human support.
- Define response style (friendly, concise, Danish-first).
- **Acceptance criteria:**
  - Documented policy for what bot may/may not answer.
  - Clear handoff path when confidence is low.

### TASK-6.2 Knowledge base pipeline (RAG)
**Status:** `TODO`
- Create source set from docs (`services`, `roadmap`, FAQ, pricing, setup guides).
- Build ingestion/chunking/indexing pipeline.
- Add refresh process when docs change.
- **Acceptance criteria:**
  - Bot answers are grounded in current docs.
  - Source attribution available in logs/debug mode.

### TASK-6.3 Chat API + session model
**Status:** `TODO`
- Add `/api/chat` endpoint with conversation/session handling.
- Add rate limiting, abuse protection, and basic moderation.
- Store conversation metadata for support follow-up.
- **Acceptance criteria:**
  - Stable API contract with authenticated and public modes.
  - Request limits protect cost and abuse.

### TASK-6.4 Frontend chat widget
**Status:** `TODO`
- Add on-site chat widget (public + admin where relevant).
- Add quick actions (pricing, setup, billing, contact support).
- Add fallback CTA to contact form when unresolved.
- **Acceptance criteria:**
  - Chat widget works on desktop/mobile.
  - Users can escalate to human support in one click.

### TASK-6.5 Human handoff and CRM/support integration
**Status:** `TODO`
- Convert unresolved chats into support leads/tickets.
- Include conversation summary and user contact details.
- Add internal view for open chatbot escalations.
- **Acceptance criteria:**
  - Failed chatbot interactions become actionable tickets/leads.
  - Team can respond without losing context.

### TASK-6.6 Analytics and quality loop
**Status:** `TODO`
- Track resolution rate, escalation rate, response latency, top intents.
- Add review workflow for incorrect answers.
- Improve prompts/knowledge base iteratively.
- **Acceptance criteria:**
  - Monthly quality dashboard available.
  - Continuous improvement workflow defined.

---

## EPIC-7 Enterprise Branding and Internal Admin Console
**Goal:** Give each customer their own workspace styling, while allowing Enterprise customers to get fully custom branded UI controlled by Neutralplayer internal admins.
**Business rule:** Non-Enterprise customers use platform default styling. Enterprise customers can use customer-specific brand themes.
**Scope decision (locked):**
- Enterprise customers can self-manage branding (within allowed token limits).
- Branding applies to all authenticated surfaces and the delivered embed player.

### TASK-7.1 Theming domain model and plan gate
**Status:** `DONE`
- Add tenant-level theme model (e.g. `OrganizationTheme`) with versioning (`draft`/`published`).
- Add feature flag/capability gate: `enterpriseBrandingEnabled`.
- Map capability from active subscription plan (`enterprise` = true, all other plans = false).
- **Acceptance criteria:**
  - Theme can be stored per organization without affecting others.
  - Non-Enterprise orgs are hard-blocked from custom theme usage server-side.

### TASK-7.2 Design tokens and safe theme schema
**Status:** `DONE`
- Define strict schema for customizable tokens:
  - Colors (primary, surface, text, muted, danger, success)
  - Typography (allowed font families/weights/scales)
  - Radius, shadows, button style variants
  - Player controls (play button colors, hover, border)
- Add validation and sanitization (zod + allowlist only; no raw CSS injection).
- **Acceptance criteria:**
  - Invalid token payloads are rejected.
  - Theme config cannot inject arbitrary CSS/JS.

### TASK-7.3 Runtime theme engine
**Status:** `DONE`
- Build server-driven theme resolver:
  - `default theme` -> optional `org theme override` -> page/component mapping.
- Emit CSS variables per request (or cached theme CSS artifact).
- Ensure no flash-of-unstyled-content on auth/admin pages.
- Apply theme consistently in post-login app routes and embed runtime.
- **Acceptance criteria:**
  - Theme loads consistently on dashboard, projects, embed editor, profile.
  - Same org theme is applied in `/embed/[id]` player delivery.
  - Switching org/theme reflects correctly after publish.

### TASK-7.4 Enterprise player skinning
**Status:** `DONE`
- Extend player UI layer to consume theme tokens for:
  - Play button style
  - Controls color states
  - Focus/hover treatments
- Keep accessibility constraints (contrast and focus ring visibility).
- **Acceptance criteria:**
  - Enterprise orgs get branded player controls.
  - Non-Enterprise orgs continue using standard Neutralplayer skin.

### TASK-7.5 Internal Neutral admin role and permissions
**Status:** `DONE`
- Add internal platform role(s): `np_super_admin`, `np_support_admin`.
- Add protected admin area (e.g. `/internal`) only for Neutral staff.
- Implement org selector + permission checks + audit logging.
- **Acceptance criteria:**
  - Internal area is inaccessible to customer users.
  - All theme changes are traceable in audit log with actor + timestamp.
- Progress note:
  - `DONE`: Beskyttet `/internal` omraade implementeret med server-side adgangstjek.
  - `DONE`: Org selector + internal API-lag implementeret.
  - `DONE`: Audit-log events ved internal publish og rollback paa org-themes.
  - `DONE`: Rolle-governance i internal branding-flows: `np_support_admin` er read-only, kun `np_super_admin` kan write/publish/rollback.
  - `DONE`: Endelig governance-policys for bootstrap via `INTERNAL_ADMIN_EMAILS` dokumenteret med klare bootstrap- og afviklingsregler.

### TASK-7.6 Internal theme management UI
**Status:** `DONE`
- Build internal tools to:
  - Select organization
  - Edit global default theme
  - Edit org-specific draft theme
  - Preview changes before publish
  - Publish/rollback theme versions
- **Acceptance criteria:**
  - Internal admin can safely update one org without side effects.
  - Rollback restores previous published version immediately.

### TASK-7.7 Customer-facing brand controls (Enterprise-only)
**Status:** `DONE`
- Implement Enterprise self-service branding controls:
  - Enterprise customer admins can edit limited token subset in `/admin/profile/branding`.
  - Neutral internal admins can still override/support via internal admin console.
- Enforce capability checks + validation on all endpoints.
- **Acceptance criteria:**
  - Enterprise self-service is implemented consistently in UI + API + permissions.
  - Unauthorized edits return clear `403` responses.
- Progress note:
  - `DONE`: Enterprise customer admins har self-service branding i `/admin/profile/branding`.
  - `DONE`: Customer self-service er begraenset til et godkendt token-subset, mens internal console stadig har fuld kontrol.
  - `DONE`: API validerer og afviser advanced token-aendringer uden for customer subset.

### TASK-7.8 Migration, fallback, and rollout plan
**Status:** `DONE`
- Backfill all orgs with default theme reference.
- Add safe fallback if org theme is missing/corrupt.
- Rollout in phases:
  - Phase A: internal tools + dark-launch
  - Phase B: pilot with 1-2 Enterprise customers
  - Phase C: general Enterprise availability
- **Acceptance criteria:**
  - Existing customers see zero visual regression during rollout.
  - Fallback protects runtime if theme payload fails validation.
- Progress note:
  - `DONE`: Runtime fallback validerer stored theme payloads og falder sikkert tilbage til global/default theme.
  - `DONE`: Backfill-script til published global default theme er dokumenteret og tilgaengeligt via `npm run theme:backfill-default`.
  - `DONE`: Lokalt rollout-check den 2026-04-06 returnerede `noop`, hvilket bekraefter en eksisterende published global default theme i dev-miljoeet.
  - `DONE`: Rollout-guide dokumenterer nu konkrete Phase A/B/C gates og rollback-signaler pr. miljoe. Miljoe-eksekvering sker via runbook, ikke ny kode.

### TASK-7.9 Monitoring, tests, and operational guardrails
**Status:** `DONE`
- Add tests:
  - API tests for permission + validation + plan gate
  - E2E tests for themed vs non-themed org behavior
- Add observability:
  - logs/events for publish/rollback/theme-apply failures
  - alerting on repeated theme resolve errors
- **Acceptance criteria:**
  - CI covers critical theme flows.
  - Theme incidents are diagnosable in logs/Sentry.
- Progress note:
  - `DONE`: API contract tests daekker permissions, validation, plan-gate og observability hooks for branding flows.
  - `DONE`: E2E smoke daekker starter vs enterprise branding samt player-skin variables.
  - `DONE`: Theme publish/rollback og runtime resolve-fejl logger nu med structured metadata og `requestId`.
  - `DONE`: Sentry-setup dokumenterer nu en konkret alert for repeated `Invalid theme payload detected` warnings, inkl. threshold og incident-respons.

---

## Suggested execution order
1. `EPIC-1` (all tasks)
2. `EPIC-2` (all tasks)
3. `TASK-3.1`, `TASK-3.2`, `TASK-3.3`
4. `EPIC-4`
5. `EPIC-5` (continuous hardening)
6. `EPIC-7` (start with `TASK-7.1` + `TASK-7.2`, then internal admin + rollout)

---

## Deployment Checklist (Vercel)
1. Confirm `DATABASE_URL` is set in Vercel environment variables.
2. Commit all Prisma migrations in `prisma/migrations/*`.
3. Ensure build script runs migrations automatically:
   - `prisma generate && prisma migrate deploy && next build`
4. Deploy to preview first and verify:
   - Login/Register
   - Invite flow (`/admin/users` -> invite -> `/invite/[token]`)
5. Promote to production after preview verification.

---

## Recently delivered outside roadmap IDs
- `DONE`: Observability baseline med request-correlation ID og structured logs paa kritiske API-ruter.
- `DONE`: Sentry integration i Next.js med guide i `docs/sentry-setup.md`.
- `DONE`: Webhook hardening for Stripe og Mux, inkl. signaturvalidering og idempotency.
- `DONE`: Baseline rate limiting for auth, uploads og write-heavy API-ruter.
- `DONE`: Marketing, pricing, contact, onboarding, invites og workspace setup er koert i maal som del af SaaS-MVP.
- `DONE`: Enterprise branding-sporet er leveret med internal admin console, customer self-service subset, runtime fallback, observability og rollout-runbook.
- `DONE`: Lokal full-flow E2E daekker signup, workspace setup, billing fixture, projekt, variant og embed.

---

## Performance Plan
- Status: `IN PROGRESS`
- Fokus:
  - bundle-budget og CI guardrails
  - lazy-loading af player-komponenter
  - media fallback og hero performance
  - fortsat forbedring af TTFB, LCP og client chunk size
- Seneste noter:
  - `DONE`: Low-risk split af offentlig player-komponent via lazy loading.
  - `DONE`: On-demand media-aktivering i `EmbedVariantCard`.
  - `DONE`: Hero media fallback med `HeroMedia` og dedikeret poster.
  - `MEASURED`: Bundle-budget holdes inden for nuvaerende CI-graenser.
  - `NEXT`: Fortsaet fase 4 med hero-video varianter, poster fallback og yderligere LCP-forbedringer.

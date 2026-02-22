# SaaS Roadmap (Source of Truth)

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

---

## EPIC-6 AI Support Chatbot (Future)
**Goal:** Give customers instant self-service answers and collect qualified leads/support requests.
**Priority:** `LATER` (ikke nu)

### TASK-6.1 Chatbot scope and guardrails
**Status:** `TODO`
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

## Suggested execution order
1. `EPIC-1` (all tasks)
2. `EPIC-2` (all tasks)
3. `TASK-3.1`, `TASK-3.2`, `TASK-3.3`
4. `EPIC-4`
5. `EPIC-5` (continuous hardening)

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
- `DONE`: Observability baseline med request-correlation ID (`x-request-id` i proxy) og strukturerede JSON-logs på kritiske API-ruter (checkout, register, stripe webhook, invites, embeds, workspace).
- `DONE`: Sentry integration i Next.js (client, server, edge, global error capture) + guide i `docs/sentry-setup.md`.
- `DONE`: Webhook hardening: Mux-signaturvalidering (raw body + `mux-signature`) samt idempotency/replay-beskyttelse via `MuxWebhookEvent`.
- `DONE`: Baseline rate limiting på auth + uploads + write-heavy API-ruter med ensartet `429 RATE_LIMITED` svar og `Retry-After` headers.
- `IN PROGRESS`: Test strategy baseline implementeret med Vitest (unit + API contracts), Playwright E2E smoke og CI-workflow i `.github/workflows/ci.yml`. Fuldt signup/checkout/upload/embed E2E er staged i `tests/e2e/full-acquisition-and-content.spec.ts`.
- `DONE`: Team invite flow with real token links and accept page.
- `DONE`: Pending invites list with `resend` and `cancel` actions in `app/admin/users/page.tsx`.
- `DONE`: Public pricing page (`/pricing`) and pre-admin plan selection flow.
- `DONE`: Frontpage (`/`) som entrypoint med tydelig split mellem eksisterende kunder og køb-flow.
- `DONE`: Marketing pages udbygget med FAQ (`/faq`) og Kontakt (`/contact`) inkl. dedikeret kontaktformular og CTA-links fra forside/pricing.
- `DONE`: Dansk som default i frontend + central tekststruktur (`lib/i18n/messages.ts`) klar til oversættelser.
- `DONE`: Server-side plan-grænser (projekter, varianter, seats) med upgrade-required svar.
- `DONE`: UX copy polish på tværs af public + admin (naturligt dansk, konsistent ordvalg, ryddet tegnkodning).
- `DONE`: Onboarding-guide i dashboard med progress (projekt -> upload -> embed-kopi -> gennemført), auto-opdatering af trin og menupunktet `Vis onboarding`.
- `DONE`: Usage & upgrade UX med forbrugsbarer i dashboard og 1-klik `Opgradér nu` fra blokerede handlinger (projekter, varianter, seats/invites).
- `DONE`: Tydelig sektionering i navigationen med dedikerede admin-sider: Dashboard, Projekter, Team, Domains, Billing, Audit.
- `DONE`: Signup/workspace-setup flow med verify-link (`/verify-email`), resend verify endpoint, ny side `/setup/workspace`, gem af workspace-navn (`/api/workspace`) og registrering der guider nye brugere via setup før dashboard/pricing.
- `DONE`: Invitation-flow forbedret, så inviterede uden eksisterende konto guides til `Opret konto` som primær handling før accept.
- `DONE`: Email setup dokumenteret i `docs/email-setup.md` (Resend + Vercel + DNS + test/fejlfinding).

---

## Next Logical Step
- `TASK-5.4 Test strategy` (færdiggør næste).
- Hvorfor: CI + baseline tests er på plads. Næste skridt er at aktivere fuld E2E-flow (signup/checkout/upload/embed) i dedikeret testmiljø.

---

## Ready-to-paste prompt examples
- `Implement TASK-1.2 from docs/saas-roadmap.md. Keep changes minimal and include tests.`
- `Implement TASK-2.3 from docs/saas-roadmap.md and list required env vars.`
- `Implement TASK-3.3 from docs/saas-roadmap.md with clear usage bars and one-click upgrade CTAs.`









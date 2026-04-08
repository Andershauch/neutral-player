# SaaS Roadmap (Source of Truth)
## Document Version
- Current release: v0.3.0
- Last updated: 2026-04-07


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
**Status:** `DONE`
- Add E2E (signup/checkout/upload/embed).
- Add API tests (tenant isolation + RBAC + limits).
- **Acceptance criteria:**
  - CI enforces lint + typecheck + tests + build.
- Progress note:
  - `DONE`: CI koerer allerede lint, typecheck, unit/API tests, E2E smoke og build.
  - `DONE`: API contract tests daekker tenant isolation, RBAC, plan-limits og branding guardrails.
  - `DONE`: Full lokal acquisition/content E2E daekker signup, workspace setup, billing fixture, projekt, variant og embed.
  - `DONE`: Gated ekstern E2E-suite er scaffolded til rigtig Stripe checkout og rigtig Mux upload via appens normale upload-entrypoint.
  - `DONE`: Ekstern hosted checkout og rigtig Mux-upload blev verificeret lokalt den 2026-04-07 via den gatede suite.
- Next-session closeout plan:
  - `DONE`: Stripe test-price IDs, webhook secret og Mux credentials blev brugt i en succesfuld lokal gated run.
  - `DONE`: Den gatede eksterne suite koerer nu stabilt mod rigtig hosted checkout.
  - `DONE`: Den gatede eksterne suite koerer nu stabilt mod rigtig Mux upload og playback readiness.
  - `DONE`: Den eksterne E2E holdes fortsat ude af standard-CI og koeres som preview eller manual gated suite.

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

## SPRINT-8 General Default Layout and Look and Feel
**Goal:** Loefte marketing-sider, standard-sider og default layout til et mere sammenhaengende, bevidst og professionelt look and feel.
**Status:** `IN PROGRESS`
**Scope:** Offentlige marketing-sider, auth/default sider og andre ikke-theme-overstyrede standardflader.
**Princip:** Bevar implementationen enkel og genbrug eksisterende primitives, men vaer mere konsekvent i layout, spacing, typografi, farver og visuel retning.

### TASK-8.1 UI audit og baseline
**Status:** `DONE`
- Kortlaeg nuvaerende marketing-sider og standard-sider:
  - Landing
  - Pricing
  - FAQ
  - Contact
  - Login
  - Register
  - Verify/setup flows
- Identificer inkonsistenser i:
  - hero-struktur
  - spacing
  - card-styles
  - typography hierarchy
  - CTA-behandling
- **Acceptance criteria:**
  - Der findes en kort prioriteret liste over de vigtigste layout- og visual-design-huller.
- Progress note:
  - `DONE`: Audit og baseline er dokumenteret i `docs/default-layout-audit.md`.
  - `DONE`: Hoeste prioriterede huller er nu tydeligt afgraenset til shared shell, CTA-hierarki, header-familie, card-system, typografi og copy/encoding sweep.

### TASK-8.2 Shared default layout primitives
**Status:** `IN PROGRESS`
- Definer eller stram et lille default UI-lag for ikke-enterprise flader:
  - page shell
  - section rhythm
  - content width regler
  - headline/subhead moenstre
  - CTA-raekker
- **Acceptance criteria:**
  - Marketing og standard-sider bruger samme baseline for layout og spacing.
- Progress note:
  - `DONE`: Shared public/default shell-klasser er tilfoejet i `app/globals.css`.
  - `DONE`: Default public look er nu flyttet over i et lille token-lag via `np-default-theme`, saa senere redesigns kan ske med mindre strukturelt churn.
  - `DONE`: Pricing, FAQ og Contact bruger nu samme public header, section cards og CTA-baseline.
  - `DONE`: Login, Register og Workspace setup bruger nu samme default form-shell og kortfamilie.
  - `IN PROGRESS`: Landing og oevrige default/system flader mangler stadig sidste harmonisering mod samme baseline.

### TASK-8.3 Marketing polish sprint
**Status:** `IN PROGRESS`
- Opdater Landing, Pricing, FAQ og Contact til en tydelig faelles visuel retning.
- Fokus:
  - staerkere hero-komposition
  - mere konsekvent CTA-hierarki
  - bedre brug af baggrunde, overflader og sektionsovergange
  - mindre generisk SaaS-look
- **Acceptance criteria:**
  - Marketing-siderne foeles som samme produkt og samme brandfamilie.
- Progress note:
  - `DONE`: Landing prioriterer nu servicevalg, sales-led CTA'er og kundehistorier som primaer marketing-retning.
  - `DONE`: Pricing, FAQ og Contact deler nu samme marketing-familie med section-intros, data-strips, form-primitives og tydeligere beslutningshjaelp.
  - `IN PROGRESS`: Der mangler stadig en sidste visuel harmonisering mellem marketing-siderne og auth/system-siderne.

### TASK-8.4 Default auth og system pages polish
**Status:** `IN PROGRESS`
- Opdater Login, Register, Verify og Setup-sider, saa de matcher marketingens baseline.
- Fokus:
  - tydeligere informationshierarki
  - renere formular-layouts
  - bedre tomrum og visuel ro
- **Acceptance criteria:**
  - Default-siderne foeles som en naturlig fortsaettelse af marketingoplevelsen.
- Progress note:
  - `DONE`: Login og Register bruger nu samme guided system-page familie med venstrestillet kontekst og roligere formularflade.
  - `DONE`: Verify, Workspace setup, Invite og Unauthorized matcher nu samme default shell, status-bannere og system-side rytme.
  - `IN PROGRESS`: Der mangler stadig sidste finish paa tvungen copy/guardrails-dokumentation i `TASK-8.5`.

### TASK-8.5 Default design rules og guardrails
**Status:** `DONE`
- Dokumenter de vigtigste default designregler direkte i roadmapen eller relateret docs:
  - typografi
  - spacing
  - card og surface treatment
  - CTA-principper
  - hvad der skal forblive simpelt
- **Acceptance criteria:**
  - Naeste UI-arbejde paa marketing og default sider kan foelge samme retning uden at opfinde nyt hver gang.
- Progress note:
  - `DONE`: Default designregler og guardrails er dokumenteret i `docs/default-design-rules.md`.
  - `DONE`: Reglerne laaser struktur, CTA-hierarki, approved surfaces og copy-kvalitet uden at laase det visuelle udtryk fast.

---

## SPRINT-9 Internal Marketing Content Control
**Goal:** Give `np_super_admin` mulighed for at redigere og publicere marketing-indhold, billeder og udvalgte CTA'er uden kodeændringer.
**Status:** `DONE`
**Scope:** Landing, Pricing, FAQ og Contact i første version. Senere kan andre public/default sider kobles på samme model.
**Princip:** Byg et internt, struktureret CMS i egen app. Undgaa fri page-builder i v1. Layout og rendering bliver i kode; indhold, billeder og sektion-data bliver redigerbare.

### TASK-9.1 Marketing content domain model
**Status:** `DONE`
- Tilføj marketing content-modeller med versionsstyring:
  - `MarketingPage`
  - `MarketingPageVersion`
  - `MarketingAsset`
- Brug `draft` og `published` status i stedet for at skrive direkte på live-indhold.
- Gem sideindhold som struktureret JSON pr. sideversion.
- **Acceptance criteria:**
  - Hver marketing-side kan have mindst én draft og én published version.
  - Assets kan refereres fra sideindhold uden at hardcode paths i page-filer.
  - Schemaet er klart afgrænset til marketing/public content og blander ikke planlogik eller theme-motor sammen med content.
- **Progress note (2026-04-08):**
  - Prisma-domænet er lagt i [prisma/schema.prisma](/C:/Users/ander/neutral-player/prisma/schema.prisma) med separate modeller for pages, versions og assets.
  - Første migration er genereret i [prisma/migrations/20260408121000_add_marketing_content_models/migration.sql](/C:/Users/ander/neutral-player/prisma/migrations/20260408121000_add_marketing_content_models/migration.sql).
  - V1-sidekatalog og statuses er samlet i [lib/marketing-pages.ts](/C:/Users/ander/neutral-player/lib/marketing-pages.ts) med en lille kontrakttest i [tests/unit/marketing-pages.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-pages.test.ts).

### TASK-9.2 Safe content schema og editor-contracts
**Status:** `DONE`
- Definér validerede content schemas for:
  - `home`
  - `pricing`
  - `faq`
  - `contact`
- Hold schemas strukturerede og sektion-specifikke:
  - hero
  - service cards
  - stories
  - trusted-by
  - CTA blocks
  - FAQ groups
- Brug allowlisted felter frem for fri rich text i v1.
- **Acceptance criteria:**
  - Indhold kan valideres server-side før save og publish.
  - Ugyldige eller ufuldstændige payloads kan ikke publiceres.
  - Det er tydeligt hvilke felter der er editable, og hvilke der stadig er kodestyrrede.
- **Progress note (2026-04-08):**
  - De server-side schemas og editor-kontrakter ligger i [lib/marketing-content-schema.ts](/C:/Users/ander/neutral-player/lib/marketing-content-schema.ts).
  - Validatoren er strict og afviser ukendte felter, usikre links og ufuldstændige sektioner.
  - Editable sektioner pr. side er samlet i `MARKETING_EDITOR_SECTIONS`, så editor-UI'et kan bygges oven på samme contract.
  - Kontrakterne er dækket af [tests/unit/marketing-content-schema.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-content-schema.test.ts).

### TASK-9.3 Internal marketing editor UI
**Status:** `DONE`
- Tilføj et nyt internal spor, fx `/internal/marketing`.
- Byg en editor med:
  - sidevælger
  - sektion-for-sektion formularer
  - asset picker/reference
  - save draft
  - preview
  - publish
  - rollback
- Begræns write-adgang til `np_super_admin`.
- **Acceptance criteria:**
  - Super admin kan redigere mindst én marketing-side end-to-end uden kode.
  - `np_support_admin` kan højst have read/preview, ikke publish.
  - Editorfladen bruger samme internal governance- og audit-mønstre som branding-sporet.
- **Progress note (2026-04-08):**
  - Internal editoren ligger nu på [app/internal/marketing/page.tsx](/C:/Users/ander/neutral-player/app/internal/marketing/page.tsx) med UI i [components/internal/InternalMarketingConsole.tsx](/C:/Users/ander/neutral-player/components/internal/InternalMarketingConsole.tsx).
  - API-flowet for read, save draft, publish og rollback ligger i [app/api/internal/marketing/content/route.ts](/C:/Users/ander/neutral-player/app/api/internal/marketing/content/route.ts).
  - Write-adgang er låst til `np_super_admin`, mens andre internal roller får read/preview via [lib/internal-auth.ts](/C:/Users/ander/neutral-player/lib/internal-auth.ts) og [app/api/internal/access/route.ts](/C:/Users/ander/neutral-player/app/api/internal/access/route.ts).
  - V1 bruger section-for-section JSON-formularer med fælles server-validator og en lokal preview, så vi kan redigere mindst én marketing-side end-to-end uden at bygge en fri page-builder.

### TASK-9.4 Asset management for marketing
**Status:** `DONE`
- Tilføj en enkel asset-model til hero-billeder, posters og udvalgte marketing-media.
- Understøt:
  - upload
  - alt-tekst
  - aspect-ratio guidance
  - preview
  - reference fra marketing content
- Hold v1 enkel: billeder først, video senere hvis nødvendigt.
- **Acceptance criteria:**
  - Marketing-editoren kan skifte billeder uden kode deploy.
  - Assets har title/alt og er sikre at bruge på public sider.
  - Der er en klar fallback hvis et asset mangler eller slettes.
- **Progress note (2026-04-08):**
  - Asset-upload ligger i [app/api/internal/marketing/assets/route.ts](/C:/Users/ander/neutral-player/app/api/internal/marketing/assets/route.ts) med mime/size-guardrails, alt-tekstkrav, observability og audit log.
  - V1 asset-helperne ligger i [lib/marketing-assets.ts](/C:/Users/ander/neutral-player/lib/marketing-assets.ts) med key-normalisering, ratio-guidance og fallback-URL.
  - Editoren i [components/internal/InternalMarketingConsole.tsx](/C:/Users/ander/neutral-player/components/internal/InternalMarketingConsole.tsx) kan nu uploade billeder, vise preview, vise ratio-guidance og kopiere `assetKey` direkte ind i content-felter.
  - Asset-kontrakterne er dækket i [tests/unit/marketing-assets.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-assets.test.ts) og [tests/api/marketing-content-contracts.test.ts](/C:/Users/ander/neutral-player/tests/api/marketing-content-contracts.test.ts).

### TASK-9.5 Runtime resolver og public fallback
**Status:** `DONE`
- Byg en content-resolver til public sider:
  - brug `published` content hvis det findes
  - fallback til kode-defaults hvis content mangler eller er ugyldigt
- Hold layout-komposition i kode og map kun content ind i sektioner.
- Start med `home`, og udvid derefter til `pricing`, `faq` og `contact`.
- **Acceptance criteria:**
  - Public sider kan rendere published marketing content uden at miste eksisterende layout/system.
  - Manglende content giver ikke runtime-fejl på live sider.
  - Live oplevelsen kan stadig fungere fuldt ud uden editor-data i DB.
- **Progress note (2026-04-08):**
  - Runtime-resolveren ligger i [lib/marketing-content-runtime.ts](/C:/Users/ander/neutral-player/lib/marketing-content-runtime.ts) med validering, asset-opslag og sikkert fallback til kode-defaults.
  - Public siderne [app/page.tsx](/C:/Users/ander/neutral-player/app/page.tsx), [app/pricing/page.tsx](/C:/Users/ander/neutral-player/app/pricing/page.tsx), [app/faq/page.tsx](/C:/Users/ander/neutral-player/app/faq/page.tsx) og [app/contact/page.tsx](/C:/Users/ander/neutral-player/app/contact/page.tsx) bruger nu published marketing content når det findes.
  - Hvis DB-data mangler, er ugyldige eller migrationen ikke er deployet endnu, falder siderne automatisk tilbage til defaults i [lib/marketing-content-defaults.ts](/C:/Users/ander/neutral-player/lib/marketing-content-defaults.ts).
  - Fallback-opførslen er dækket i [tests/unit/marketing-content-runtime.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-content-runtime.test.ts).

### TASK-9.6 Preview, publish, rollback og audit
**Status:** `DONE`
- Tilføj preview-flow for drafts før publish.
- Log alle ændringer i audit:
  - draft saved
  - asset changed
  - published
  - rolled back
- Giv tydelig skelnen mellem draft og live.
- **Acceptance criteria:**
  - Super admin kan se og teste draft før publish.
  - Publish og rollback er sporbare med bruger, tidspunkt og side.
  - Live marketing-indhold kan genskabes til tidligere version ved fejl.
- **Progress note (2026-04-08):**
  - Draft-previewet ligger nu på [app/internal/marketing/preview/[pageKey]/page.tsx](/C:/Users/ander/neutral-player/app/internal/marketing/preview/%5BpageKey%5D/page.tsx) og bruger samme content-model som editoren.
  - Editoren i [components/internal/InternalMarketingConsole.tsx](/C:/Users/ander/neutral-player/components/internal/InternalMarketingConsole.tsx) linker nu tydeligt til både draft preview og live public-side.
  - Audit-sporet dækker draft save, asset upload, publish og rollback via [app/api/internal/marketing/content/route.ts](/C:/Users/ander/neutral-player/app/api/internal/marketing/content/route.ts) og [app/api/internal/marketing/assets/route.ts](/C:/Users/ander/neutral-player/app/api/internal/marketing/assets/route.ts).
  - Preview-kontrakten er dækket i [tests/api/marketing-content-contracts.test.ts](/C:/Users/ander/neutral-player/tests/api/marketing-content-contracts.test.ts).

### TASK-9.7 Tests og operational guardrails
**Status:** `DONE`
- Tilføj tests for:
  - role-gates
  - schema validation
  - resolver fallback
  - publish/rollback flow
- Tilføj observability omkring content resolve og preview/publish fejl.
- Dokumentér runbook for hvordan marketing-indhold redigeres sikkert.
- **Acceptance criteria:**
  - CI dækker de kritiske content-management flows.
  - Marketing-indholdsfejl er diagnoserbare i logs og audit.
  - En super admin kan følge en dokumenteret proces for redigering uden at gætte.
- **Progress note (2026-04-08):**
  - Kontrakt- og unit-tests dækker nu role-gates, schema validation, asset helpers, resolver fallback og preview/publish/rollback contracts i [tests/api/marketing-content-contracts.test.ts](/C:/Users/ander/neutral-player/tests/api/marketing-content-contracts.test.ts), [tests/unit/marketing-content-schema.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-content-schema.test.ts), [tests/unit/marketing-content-runtime.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-content-runtime.test.ts) og [tests/unit/marketing-assets.test.ts](/C:/Users/ander/neutral-player/tests/unit/marketing-assets.test.ts).
  - Runtime og preview fallback-situationer logges nu tydeligere i [lib/marketing-content-runtime.ts](/C:/Users/ander/neutral-player/lib/marketing-content-runtime.ts).
  - Den operationelle arbejdsgang er dokumenteret i [docs/marketing-content-runbook.md](/C:/Users/ander/neutral-player/docs/marketing-content-runbook.md).

### Implementation notes
- V1 skal være et struktureret content-system, ikke en fri blok-editor.
- Planer, Stripe-priser, theme-tokens og produktregler forbliver kodestyrrede.
- Marketing-copy, billeder, cards, stories, FAQ og CTA'er bliver redigerbare.
- Start med `home` som reference-side. Når mønsteret er godt, udvid til de øvrige marketing-sider.
- Public rendering skal altid kunne falde tilbage til de nuværende kode-defaults.

---

## Suggested execution order
1. `EPIC-1` (all tasks)
2. `EPIC-2` (all tasks)
3. `TASK-3.1`, `TASK-3.2`, `TASK-3.3`
4. `EPIC-4`
5. `EPIC-5` (continuous hardening)
6. `EPIC-7` (start with `TASK-7.1` + `TASK-7.2`, then internal admin + rollout)
7. `SPRINT-8` (general default layout, marketing polish og look and feel)
8. `SPRINT-9` (internal marketing content control med draft/publish/preview)

---

## SPRINT-10 Unified User Journey and Navigation
**Goal:** Skabe en helt gennemfoert og logisk brugerrejse paa tvaers af public sider, auth/setup, koebsflow, customer admin og internal admin.
**Status:** `DONE`
**Scope:** Navigation, shells, page-intros, breadcrumbs, CTA-retning og "naeste skridt"-logik paa tvaers af hele appen.
**Princip:** Faerre navigationstyper, tydeligere informationsarkitektur og samme oplevelse af orientering foer login, efter login og i interne flows.

### TASK-10.1 Journey audit og target map
**Status:** `DONE`
- Audit og target-state er dokumenteret i `docs/user-journey-audit.md`.

### TASK-10.2 Shared shell strategy
**Status:** `DONE`
- Shell-strategien er dokumenteret i `docs/navigation-shell-strategy.md`.
- `/internal` har nu en egentlig internal shell via `app/internal/layout.tsx` og `components/internal/InternalNav.tsx`.
- Customer admin-shellens hovedgruppering er strammet i `components/admin/Sidebar.tsx`.

### TASK-10.3 Shared page header and breadcrumb contract
**Status:** `DONE`
- Faelles page-header kontrakt ligger i `components/navigation/AppPageHeader.tsx`.
- Dashboard, Projects, Profile, Internal home, Internal marketing og embed-editoren bruger nu samme page-header familie.

### TASK-10.4 Public and acquisition journey cleanup
**Status:** `DONE`
- Public siderne bruger nu faelles header via `components/public/PublicSiteHeader.tsx`.
- Login, Register, Verify, Invite, Unauthorized og Workspace setup er koblet paa samme public shell.

### TASK-10.5 Customer admin IA and shell refinement
**Status:** `DONE`
- Billing er nu en rigtig destinationsside i `app/admin/billing/page.tsx`.
- Team, Audit, Branding og Profile bruger samme page-header familie som resten af admin.

### TASK-10.6 Project and embed editor journey
**Status:** `DONE`
- `app/admin/embed/[embedId]/page.tsx` giver nu tydelig breadcrumb og bedre tilbageveje.
- `components/admin/EmbedEditor.tsx` er bygget som en 4-trins arbejdsgang med projektinfo, versioner, upload/preview og deling.
- `components/admin/EmbedVariantCard.tsx`, `components/admin/EmbedCodeGenerator.tsx` og `components/admin/CreateProjectModal.tsx` peger nu tydeligere paa naeste handling.

### TASK-10.7 Internal shell and tool navigation
**Status:** `DONE`
- Internal-shellen har nu mere konsekvent tool-navigation paa tvaers af branding, marketing og preview via `components/internal/InternalNav.tsx`, `app/internal/page.tsx` og `app/internal/marketing/preview/[pageKey]/page.tsx`.

### TASK-10.8 Journey verification and guardrails
**Status:** `DONE`
- Journey-reglerne er dokumenteret i `docs/journey-guardrails.md`.
- Public smoke dækker nu også shared før-login shell i `tests/e2e/public-flows.spec.ts`.

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

# SaaS Roadmap (Source of Truth)
## Document Version
- Current release: v0.2.2
- Last updated: 2026-02-23


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
- `DONE`: Design-system pass med tokens (`np-card`, `np-kicker`, `np-btn-*`) rullet ud på Dashboard, Projekter, Team, Billing og Domains for ensartet visuel stil.
- `DONE`: Font-system opdateret til Apex New (`400` brødtekst, `700` overskrifter i caps) med lokal font-loading og guide i `docs/font-setup.md`.
- `DONE`: Domains-flow genoprettet: domæner kan nu redigeres både i projekt-editor (`/admin/embed/[embedId]`) og direkte i domains-oversigten (`/admin/domains`).
- `DONE`: Domain-validering udvidet til wildcard subdomæner (fx `*.naestved.dk`) samt normalisering af input fra komma/linjeskift.
- `DONE`: Projektkort viser poster-frames som lille thumbnail-pattern baseret på Mux playback IDs.
- `DONE`: Signup/workspace-setup flow med verify-link (`/verify-email`), resend verify endpoint, ny side `/setup/workspace`, gem af workspace-navn (`/api/workspace`) og registrering der guider nye brugere via setup før dashboard/pricing.
- `DONE`: Invitation-flow forbedret, så inviterede uden eksisterende konto guides til `Opret konto` som primær handling før accept.
- `DONE`: Email setup dokumenteret i `docs/email-setup.md` (Resend + Vercel + DNS + test/fejlfinding).
- `DONE`: Frontend pass 2 (del 1): forbedret versionskort-design i projekt-editor (`/admin/embed/[embedId]`) med mere konsistent spacing/komponentstil efter design-tokens.
- `DONE`: Signup verify-mail flow robustgjort: verificeringsmail sendes automatisk i setup-flow, og signup fejler ikke længere hvis email-provider fejler midlertidigt.
- `DONE`: Frontend pass 2 (del 2): admin-fladerne `embed`, `audit` og `users` er finpudset med ens layout, spacing og komponent-konsistens på tværs af design-tokens.
- `DONE`: Embed-editor opgraderet med inline redigering af projektnavn, topbar `Kopier kode` handling, og ny sektion-rækkefølge med fokus på varianter først.
- `DONE`: Embed-sikkerhed udvidet: domæne-håndhævelse + aktiv betalt abonnements-gate + audit logs ved blokering, inkl. tilladelse af afspilning fra eget domæne.
- `DONE`: Marketing-forside opdateret med klassisk hero/CTA-opbygning, 4 plan-kort (`Starter`, `Pro`, `Enterprise`, `Custom`) og konsistent plan-data fra billing-laget.
- `DONE`: Forside hero understøtter nu udskiftelig baggrund (video eller billede) via simpel konfiguration i `app/page.tsx`.
- `DONE`: Performance/encoding hygiene-pass: BOM-fejl fjernet i hele kodebasen (inkl. app/api/components/docs), og parse-fejl fra skjulte tegn elimineret.
- `DONE`: Frontend performance forbedret i plan/pris-flow: Stripe-prisopslag i `lib/plans.ts` er cachet (memoized + revalidate), så forside/pricing ikke laver unødige live-opslag på hvert request.
- `DONE`: Hero media-load lettet på forsiden (`preload=\"none\"` på video) for hurtigere initial rendering.

---

## Next Logical Step
- `Stripe plan expansion`: opret og koble Stripe-produkter/price IDs for `Enterprise` og `Custom`, og aktivér checkout for disse planer.
- Hvorfor: UI og planstruktur er nu klar med 4 planer, men kun `Starter`/`Pro` har aktiv checkout. Næste direkte forretningsværdi er at gøre alle plan-veje købsklare.

---

## Performance Plan (Når du er tilbage)
- **Mål:** Gør frontend hurtigere, reducér server-load, og fjern teknisk støj (encoding/dynamisk rendering), uden at bryde flows.

### Fase 1 - Baseline og måling
- Etablér baseline-metrics pr. nøgleside (`/`, `/pricing`, `/admin/dashboard`, `/admin/embed/[id]`): TTFB, LCP, JS payload, hydration-tid.
- Dokumentér hvilke sider der er `force-dynamic`, og hvorfor.
- Output: kort rapport med før-tal + top 5 flaskehalse.

#### Fase 1 status (2026-02-23): `DONE`
- Build snapshot:
  - `/` prerendered statisk med `Revalidate: 5m`.
  - `admin/*` og flere setup/pricing-sider kører stadig `force-dynamic`.
- Runtime baseline (lokal `next start`, headless browser):
  - `/`: TTFB ~51ms, DOM interactive ~536ms, load ~692ms.
  - `/pricing`: TTFB ~67ms, DOM interactive ~144ms, load ~287ms.
  - `/admin/dashboard`: ender på login-redirect, TTFB ~95ms.
  - `/admin/embed/[id]`: ender på login-redirect, TTFB ~66ms.
- JS payload (resource timing, pr. side-load):
  - `/`: ~975KB transfer, ~4968KB decoded JS.
  - `/pricing`: ~954KB transfer, ~4864KB decoded JS.
  - `admin`-målinger ovenfor er login-side payload pga. redirect.
- Teknisk hygiene:
  - BOM scan: `NO_BOM_FILES` efter cleanup.
  - Typecheck/lint: grøn.

### Fase 2 - Rendering-strategi
- Fjern eller reducer `force-dynamic` på sider der ikke behøver fuld dynamik.
- Indfør `revalidate`/cache-strategi på read-tunge visninger hvor data ikke kræver instant refresh.
- Behold dynamik kun hvor auth/session/write-flow kræver det.
- Output: målbar reduktion i TTFB på public + read-sider.

#### Fase 2 status (2026-02-23): `DONE`
- `DONE`: `/pricing` flyttet fra `force-dynamic` til statisk render med `revalidate=300`.
- `DONE`: `/verify-email` flyttet fra `force-dynamic` til statisk render med `revalidate=300`.
- `DONE`: Query-param håndtering (`billing`, `session_id`, `token`) flyttet til client-komponenter via `useSearchParams` med `Suspense`, så siderne kan prerenderes.
- `DONE`: Build-verifikation viser nu:
  - `○ /pricing  Revalidate 5m`
  - `○ /verify-email  Revalidate 5m`
- `DONE`: Admin server-fetch optimeret med parallelisering:
  - `app/admin/dashboard/page.tsx`: planer, subscription, projekter, onboarding og usage hentes nu via samlet `Promise.all`.
  - `components/admin/TeamManagementPage.tsx`: medlemsliste og pending invites hentes nu parallelt med `Promise.all`.
- `DONE`: Reduceret over-fetch i admin DB-queries:
  - `app/admin/dashboard/page.tsx`: projekter henter nu kun nødvendige felter (`id`, `name`, `groups.variants.{muxPlaybackId}`).
  - `app/admin/projects/page.tsx`: projektliste henter nu kun nødvendige felter (`id`, `name`, `groups.variants.{muxPlaybackId}`).
  - `components/admin/TeamManagementPage.tsx`: medlemsliste henter nu kun nødvendige user-felter (`id`, `name`, `email`, `image`).
- `DONE`: Dashboard-statistik flyttet fra in-memory loops til DB-aggregat:
  - `app/admin/dashboard/page.tsx`: `totalVariants` + `totalViews` beregnes nu via `prisma.variant.aggregate(...)`.
  - Resultat: mindre payload i projekthentning og lavere serverarbejde pr. request.
- `DONE`: Yderligere query-stramning i admin:
  - `app/admin/audit/page.tsx`: audit-log query bruger nu `select` med kun viste felter.
  - `components/admin/TeamManagementPage.tsx`: pending invites query bruger nu `select` med kun viste felter.
  - `app/admin/dashboard/page.tsx`: subscription query henter ikke længere ubrugt `status`.
- `DONE`: Projektliste-queries reduceret yderligere for thumbnail-visning:
  - `app/admin/dashboard/page.tsx` og `app/admin/projects/page.tsx` henter nu kun varianter med `muxPlaybackId` sat.
  - Varianter begrænses til `take: 6` pr. gruppe med `orderBy: sortOrder`.
  - Resultat: mindre payload og lavere serialiseringsarbejde til projektkort.
- `DONE`: Autentificeret admin-performance målt med aktiv test-subscription:
  - `/admin/dashboard`: TTFB ~207ms, load ~318ms.
  - `/admin/projects`: TTFB ~114ms, load ~196ms.
  - `/admin/team`: TTFB ~150ms, load ~275ms.
  - `/admin/billing`: TTFB ~160ms, load ~263ms.
- `OBS`: Admin-ruter er fortsat dynamiske (`ƒ`) pga. auth/tenant-kontekst (forventet og korrekt).
- `NEXT`: Gå videre til Fase 3 (bundle og client-island optimering) for at reducere JS payload på tværs af public/admin.

### Fase 3 - Bundle og client island-optimering
- Split store client-komponenter (især admin editor-flows) i mindre islands.
- Lazy-load tunge dele (uploader/player/modals) med `dynamic()` hvor relevant.
- Hold `SessionProvider` scoped til områder der faktisk kræver klient-session.
- Output: lavere JS payload og hurtigere interaktivitet på admin-sider.

#### Fase 3 status (2026-02-23): `DONE`
- `DONE`: Global `SessionProvider` fjernet fra root-layout, så public-sider ikke automatisk hydrerer next-auth klientkode.
- `DONE`: `SessionProvider` scoped til de områder der faktisk bruger klient-session:
  - `app/admin/layout.tsx` (admin-flader)
  - `app/invite/[token]/page.tsx` (invite accept-flow)
  - `app/pricing/page.tsx` via lokal wrapper omkring `PricingPlans`.
- `DONE`: `/pricing` regression rettet, så siden igen kan prerenderes med `revalidate=300` i stedet for at blive gjort dynamisk af server-session opslag.
- `DONE`: Tung videokode i embed-editor er nu lazy-loadet:
  - `components/admin/EmbedEditor.tsx` loader `@mux/mux-player-react` og `MuxUploader` via `dynamic()`, så payload reduceres ved initial rendering.
- `DONE`: Dashboard og projektoversigt lazy-loader nu store client-islands:
  - `app/admin/dashboard/page.tsx` lazy-loader `ProjectListClient`, `OnboardingChecklistCard` og `UsageLimitsCard`.
  - `app/admin/projects/page.tsx` lazy-loader `ProjectListClient`.
- `DONE`: `EmbedCodeGenerator` i `ProjectListClient` er lazy-loadet, så embed-modalens kode hentes først ved åbning.
- `NEXT`: Kør ny build-bundle sammenligning og fortsæt med lazy-loading af resterende tunge admin-islands (fx modals og sekundære editor-sektioner).

 - `DONE`: Yderligere lazy-loading af sekundÒ¦re admin-widgets:
  - `app/admin/dashboard/page.tsx` lazy-loader nu ogsÒ¥ `BillingPlansCard`.
  - `components/admin/EmbedEditor.tsx` lazy-loader `EmbedCodeGenerator`.

### Fase 4 - Media og asset-optimering
- Hero-video: lever flere kvaliteter/codecs + poster fallback, og verificér mobil-performance.
- Gennemgå billeder/fonts for optimal format og loading-prioritet.
- Output: bedre LCP og mindre dataforbrug på forsiden.

### Fase 5 - Guardrails i drift
- Tilføj performance-budget checks i CI (bundle-størrelse + Lighthouse/TTFB thresholds i preview).
- Behold encoding-regel: UTF-8 uden BOM i repo (evt. `.gitattributes` + lint/check script).
- Output: regressions bliver fanget tidligt før deploy.

### Definition of Done for performance-sprint
- Min. 20-30% forbedring i TTFB/LCP på de mest trafikerede sider.
- Ingen BOM/encoding-fejl i repository.
- Typecheck/lint/test/build grøn efter optimeringer.

---

## Ready-to-paste prompt examples
- `Implement TASK-1.2 from docs/saas-roadmap.md. Keep changes minimal and include tests.`
- `Implement TASK-2.3 from docs/saas-roadmap.md and list required env vars.`
- `Implement TASK-3.3 from docs/saas-roadmap.md with clear usage bars and one-click upgrade CTAs.`

## Fase 3 Log (2026-02-23)
- `DONE`: `EmbedEditor` er splittet i islands:
  - `components/admin/EmbedPreviewModal.tsx` (preview modal) lazy-loades.
  - `components/admin/EmbedVariantCard.tsx` (variantkort med upload/player) lazy-loades.
- `DONE`: Opret-projekt flow er splittet:
  - `components/admin/CreateProjectButton.tsx` holder nu kun trigger-state.
  - `components/admin/CreateProjectModal.tsx` (API/upgrade/modal logik) lazy-loades on demand.
- `MEASURED`: Post-fase-3 runtime (lokal `next start`, headless, autentificeret admin):
  - `/admin/dashboard`: TTFB ~127ms, load ~155ms, decoded JS ~741KB.
  - `/admin/projects`: TTFB ~161ms, load ~179ms, decoded JS ~726KB.
  - `/admin/embed/[id]`: TTFB ~95ms, load ~122ms, decoded JS ~716KB.
- `DONE`: Performance guardrail i CI:
  - Ny script: `scripts/check-client-bundle-budget.mjs`.
  - Kører efter build via `npm run perf:budget` i `.github/workflows/ci.yml`.
  - Budgetter: total client JS chunks (`2600 KB`) og største chunk (`1100 KB`).











- `DONE`: Low-risk split af offentlig player-komponent:
  - `components/player/MuxPlayerClient.tsx` lazy-loader nu `@mux/mux-player-react` via `dynamic()`.
- `MEASURED`: Bundle-budget effekt efter split:
  - Client chunk files: `36 -> 35`.
  - Total JS chunks: `2246.6 KB -> 2245.9 KB`.
  - Stoerste chunk: `1000.2 KB -> 997.3 KB`.
- `DONE`: On-demand media-aktivering i `EmbedVariantCard`:
  - Player/uploader mountes nu foerst ved viewport-hit (`IntersectionObserver`) eller manuel aktivering.
- `MEASURED`: Bundle-budget efter dette step:
  - Client chunk files: `35` (uendret).
  - Total JS chunks: `2246.7 KB` (praktisk talt uendret).
  - Stoerste chunk: `997.3 KB` (uendret).
- `CLOSE`: Fase 3 er afsluttet med stabile guardrails og dokumenterede maalinger.
- `DECISION`: Behold nuvaerende max-chunk budget (`1100 KB`) i CI indtil et dedikeret player/vendor-spor prioriteres.
- `NEXT`: Start Fase 4 (media og asset-optimering) med fokus paa hero-video varianter, poster fallback og LCP-forbedringer.
- `DONE` (Fase 4 - step 1): Hero media robustgjort:
  - `components/public/HeroMedia.tsx` tilfoejet med video -> image fallback ved reduced-motion eller afspilningsfejl.
  - `app/page.tsx` bruger nu flere video-sources (`webm` + `mp4`) samt dedikeret poster.
  - Lokal placeholder poster tilfoejet: `public/images/hero-product-demo.svg`.

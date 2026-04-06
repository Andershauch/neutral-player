# Testing Strategy
## Document Version
- Current release: v0.3.0
- Last updated: 2026-04-06

## Maal
- Fange regressions tidligt i CI.
- Sikre tenant-sikkerhed, RBAC og plan-limits via automatiske tests.
- Have en stabil E2E smoke-suite til public flows.

## Testtyper

### 1) Unit tests (Vitest)
- Placering: `tests/unit/*.test.ts`
- Daekker:
  - RBAC rolle-regler
  - Internal admin bootstrap/precedence regler
  - Plan-limit mapping/fallback
  - Rate-limit logik
  - Theme fallback resolution mellem default/global/org
  - Customer self-service subset validation for enterprise branding

### 2) API contract tests (Vitest)
- Placering: `tests/api/*.test.ts`
- Daekker:
  - Tenant-scope kontrakter paa centrale write-ruter
  - Brug af RBAC/org-context guards
  - Plan-limit haandhaevelse i create-heavy flows
  - Branding theme guardrails: permissions, enterprise plan-gate, payload validation og audit-log publish/rollback
  - Branding observability contracts: requestId logs for write flows og runtime failure reporting til Sentry

### 3) E2E smoke tests (Playwright)
- Placering: `tests/e2e/*.spec.ts`
- Daekker baseline public flows:
  - Landing -> Pricing navigation
  - Register-side rendering
  - Login-side rendering (credentials + Google OAuth-knap)
  - Branding smoke for starter vs enterprise orger (plan-gate + theme application i admin)
  - Player-skin smoke for enterprise themes via player CSS variables
  - Customer branding page exposes only the approved self-service subset
  - Full lokal acquisition/content flow via Prisma-fixtures for verification, billing og Mux-ready variant

## Kommandoer
- `npm run test` -> unit + API contract tests
- `npm run test:e2e` -> E2E smoke
- `npm run typecheck`
- `npm run lint`
- `npx next build`

## CI
- Workflow: `.github/workflows/ci.yml`
- CI koerer:
  1. Lint
  2. Typecheck
  3. Unit/API tests
  4. E2E smoke tests
  5. Build

## Naeste udvidelse (fuld E2E)
- Fil: `tests/e2e/full-acquisition-and-content.spec.ts`
- Daekker nu et lokalt full-flow med UI + Prisma-fixtures:
  - signup
  - workspace setup
  - billing fixture
  - projekt + variant
  - embed-verifikation
- Naeste skridt for denne test er at erstatte billing/Mux-fixtures med dedikeret eksternt Stripe/Mux testmiljoe, naar det er klar.

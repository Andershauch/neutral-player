# Testing Strategy
## Document Version
- Current release: v0.2.1
- Last updated: 2026-02-22


## Mål
- Fange regressions tidligt i CI.
- Sikre tenant-sikkerhed, RBAC og plan-limits via automatiske tests.
- Have en stabil E2E smoke-suite til public flows.

## Testtyper

### 1) Unit tests (Vitest)
- Placering: `tests/unit/*.test.ts`
- Dækker:
  - RBAC rolle-regler
  - Plan-limit mapping/fallback
  - Rate-limit logik

### 2) API contract tests (Vitest)
- Placering: `tests/api/*.test.ts`
- Dækker:
  - Tenant-scope kontrakter på centrale write-ruter
  - Brug af RBAC/org-context guards
  - Plan-limit håndhævelse i create-heavy flows

### 3) E2E smoke tests (Playwright)
- Placering: `tests/e2e/*.spec.ts`
- Dækker baseline public flows:
  - Landing -> Pricing navigation
  - Register-side rendering
  - Login-side rendering (credentials + OAuth-knapper)

## Kommandoer
- `npm run test` -> unit + API contract tests
- `npm run test:e2e` -> E2E smoke
- `npm run typecheck`
- `npm run lint`
- `npx next build`

## CI
- Workflow: `.github/workflows/ci.yml`
- CI kører:
  1. Lint
  2. Typecheck
  3. Unit/API tests
  4. E2E smoke tests
  5. Build

## Næste udvidelse (fuld E2E)
- Fil: `tests/e2e/full-acquisition-and-content.spec.ts`
- Er bevidst staged/skipped indtil dedikeret testmiljø og testkonto er klar.
- Når miljøet er klar, udvides denne med:
  - signup
  - checkout
  - upload
  - embed-verifikation



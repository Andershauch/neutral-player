# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repo.

## Hvad projektet er

Neutral-player er et multi-tenant SaaS video-CMS (Next.js 16, React 19, TypeScript, Tailwind v4, Prisma + Postgres/Neon) rettet mod danske kommuner og skoler. Kunder uploader video via Mux, organiserer den i Projekt → Gruppe → Variant (sprogversioner), og distribuerer den via en isoleret `/embed/[id]`-iframe. `README.md` er arkitektur-håndbogen. `docs/saas-roadmap.md` er den erklærede "source of truth" for roadmap/status — læs den før du antager noget er `TODO`/`DONE`, men stol ikke blindt på markørerne (kendt teknisk gæld: de er selv-rapporterede og ikke altid verificerede). `PROJECT_DASHBOARD.md` er en periodisk auto-genereret audit af projektets tilstand.

## Sprog-konvention

- Svar til brugeren, UI-tekst og dokumentation: **dansk**.
- Kode, kommentarer, commit-beskeder, variabel-/funktionsnavne: **engelsk**.

## Design-system — brug det eksisterende, opfind ikke et nyt

`app/globals.css` har allerede et token- og klasse-vokabular (`.np-card`, `.np-kicker`, `.np-btn-primary`/`.np-btn-ghost`, `.np-field`, `.np-status-banner-*`, `.np-section-card`, m.fl.), fodret af `lib/theme-schema.ts` (tema-tokens, kunde-override-grænser). `docs/default-design-rules.md` beskriver reglerne for public/auth/system-flader (gælder ikke intern admin, som har separate funktionelle behov).

Change rules (fra `default-design-rules.md`, gælder generelt):
1. Start med eksisterende primitives (`.np-*`-klasser).
2. Tilføj kun en ny klasse/komponent hvis mindst to steder i appen reelt har brug for mønsteret.
3. Nye delte regler/tokens lægges i `app/globals.css` — ikke som lokal one-off styling i en enkelt fil.
4. Undgå at hånd-kode Tailwind-strenge, der allerede har en `.np-*`-klasse eller et shared React-komponent.

**Igangværende arbejde:** `docs/saas-roadmap.md` → `SPRINT-11 Visual System Unification` er den planlagte indsats for at samle public/customer-admin/internal-admin visuelt. Et refactor-initiativ (LOC-reduktion, færre "bokse" i admin-UI'et, performance) er i gang og implementerer konkret `TASK-11.2` (token-hierarki), `TASK-11.4` (shared component primitives: `components/ui/Card`, `SectionHeader`, `StatTile`, `FormField`, `Badge`) og `TASK-11.5` (customer admin visual uplift, inkl. embed/editor). Se den aktive plan-fil for detaljeret fase-inddeling og sekventering (performance-fixes først, så delte primitiver, så migrering af én komponent ad gangen bag eksisterende e2e-tests). Opdater `docs/saas-roadmap.md`s task-status efterhånden som faser reelt landes og verificeres — undgå at gøre "DONE" endnu mere selv-rapporteret end det allerede er.

## Delte utilities at genbruge (ikke genopfinde)

- `lib/theme-schema.ts` / `lib/theme.ts` / `lib/theme-css.ts` — tema-tokens, resolve og CSS-variabel-udsendelse.
- `lib/authz.ts` — RBAC-prædikater (view/edit/manage/billing).
- `lib/plan-limits.ts` / `lib/plans.ts` — plan-grænser og plan-opløsning.
- `lib/marketing-content-*.ts` — marketing-indhold lever i databasen og rammer ikke live før republicering (se `docs/marketing-content-runbook.md`); ret aldrig kun i kode-defaults og antag at det er nok.
- `lib/prisma.ts` — Prisma client singleton.

## Test og verifikation

- `npm run test` — unit + API-contract tests (Vitest). Trygt at køre altid.
- `npm run test:e2e` — Playwright smoke-suite. Trygt at køre altid, kræver ikke eksterne credentials for kernen (nogle DB-baserede specs kræver kun at `DATABASE_URL` er sat).
- `npm run test:e2e:external` — **kør aldrig uden eksplicit aftale** med brugeren. Rammer rigtig hosted Stripe checkout og rigtig Mux-upload, kræver `E2E_ENABLE_EXTERNAL_BILLING_UPLOAD=1` og rigtige credentials.
- `npm run test:ci` inkluderer begge — spørg først, jf. `PROJECT_DASHBOARD.md`s note om at dette har "heavy dependencies".
- `npm run perf:budget` — tjekker client-bundle-størrelse mod budget (2600 KB total / 1100 KB pr. chunk), kører allerede i CI.
- Der findes i dag ingen React-komponent-tests (kun `lib/`-logik i `tests/unit/`). Tilføj dem løbende ved refactors af high-risk logik, ikke som et selvstændigt stort projekt.

## Database — vær forsigtig

`.env`/`.env.local` peger på en rigtig Neon Postgres-database (ikke en isoleret lokal/disposable dev-DB). Additive, reversible migrationer (nye indekser, nye kolonner) er lav risiko og kan køres, men:
- Kør aldrig `prisma migrate reset`, destruktive migrationer, eller noget der sletter/omdøber kolonner uden eksplicit aftale.
- `db:migrate:deploy` (`prisma migrate deploy`) er den separate deploy-kommando til produktion — brug ikke `migrate dev` som erstatning for den i en deploy-kontekst.

## Kendte faldgruber (fra tidligere hændelser, se `docs/`)

- Marketing-indhold: en kode-default-ændring rammer ikke live-siden før `scripts/publish-marketing-defaults.mjs` køres — published indhold i databasen vinder altid over kode-defaults. Se `docs/marketing-content-runbook.md`.
- `organizationId` er indekseret bredt i skemaet, men foreign keys som `Group.embedId`/`Variant.groupId` var det historisk ikke — tjek altid `@@index` ved nye hyppige join/filter-kolonner.

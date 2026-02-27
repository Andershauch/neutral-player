# External Services for Neutral Player
## Document Version
- Current release: v0.2.1
- Last updated: 2026-02-22


Denne fil er en samlet oversigt over de eksterne tjenester, som Neutral Player bruger.

## 1) Vercel (Hosting + Deploy)
- Status: `NÃ¸dvendig`
- FormÃ¥l:
  - Hoste appen (Next.js)
  - KÃ¸re builds og deployments
  - MiljÃ¸variabler (Environment Variables)
- KrÃ¦ver:
  - Kode deployet til korrekt Vercel-projekt
  - Alle nÃ¸dvendige env vars sat i korrekt miljÃ¸ (`Preview` og/eller `Production`)
- Typiske fejl:
  - "env var mangler" i API-ruter
  - Forskellig opfÃ¸rsel mellem localhost og Vercel pga. manglende env-scope

## 2) Database (PostgreSQL, fx Neon/Supabase)
- Status: `NÃ¸dvendig`
- FormÃ¥l:
  - Gemme brugere, organisationer, projekter, varianter, billing, audit logs osv.
- KrÃ¦ver:
  - `DATABASE_URL`
  - Prisma migrationer kÃ¸rt (`prisma migrate deploy`)
- Typiske fejl:
  - Prisma runtime-fejl
  - Manglende tabeller/kolonner hvis migration ikke er kÃ¸rt

## 3) Stripe (Betaling + abonnement)
- Status: `NÃ¸dvendig` for betalt SaaS-flow
- FormÃ¥l:
  - Checkout
  - Kundeportal
  - Webhooks til synk af subscription-status
- KrÃ¦ver:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_WEBHOOK_SECRET`
- Vigtigt:
  - Stripe key og price IDs skal vÃ¦re fra samme mode (test/live)
- Typiske fejl:
  - Checkout starter ikke
  - Forkerte priser i UI (fallback-labels)
  - Webhook-events synker ikke abonnement korrekt

## 4) Mux (Video upload + playback + webhook)
- Status: `NÃ¸dvendig` for videofunktionalitet
- FormÃ¥l:
  - Oprette uploads
  - Modtage playback IDs
  - Afspille video via embed
- KrÃ¦ver:
  - `MUX_TOKEN_ID`
  - `MUX_TOKEN_SECRET`
  - `MUX_WEBHOOK_SECRET`
- Typiske fejl:
  - Upload fejler
  - Video bliver ikke "klar" (playback ID mangler)
  - Webhook-signatur fejler

## 5) Resend (Transaktionelle emails)
- Status: `NÃ¸dvendig` for invite- og verify-email flow
- FormÃ¥l:
  - Sende invitationsmails
  - Sende email-verificering
  - Sende beskeder fra kontaktformular
- KrÃ¦ver:
  - `RESEND_API_KEY`
  - `INVITE_FROM_EMAIL`
  - `VERIFY_FROM_EMAIL`
  - `CONTACT_TO_EMAIL`
  - (valgfrit) `CONTACT_FROM_EMAIL`
- Typiske fejl:
  - Invitation oprettes men mail sendes ikke
  - Verify-flow krÃ¦ver manuel fallback-link

## 6) Google OAuth (Login med Google)
- Status: `Valgfri`, men nÃ¸dvendig hvis Google-login skal virke
- FormÃ¥l:
  - Social login via NextAuth
- KrÃ¦ver:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_URL` sat korrekt per miljÃ¸
  - Korrekte OAuth redirect URIs i Google Cloud Console
- Typiske fejl:
  - `redirect_uri_mismatch`
  - Login virker lokalt men ikke pÃ¥ custom domÃ¦ne

## 7) NextAuth (Auth/session)
- Status: `NÃ¸dvendig`
- FormÃ¥l:
  - Login/session-hÃ¥ndtering (credentials + Google)
- KrÃ¦ver:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (lokalt: `http://localhost:3000`, prod: dit domÃ¦ne)
- Typiske fejl:
  - Login/session fejler eller loops

## 8) Sentry (Observability)
- Status: `Anbefalet` (nu implementeret)
- FormÃ¥l:
  - Fejlsporing i frontend/backend
  - Hurtigere debugging i produktion
- KrÃ¦ver:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - (valgfrit) `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` til source maps
- Typiske fejl:
  - Fejl optrÃ¦der i produktion uden sporbarhed

## 9) DNS/Domain provider (fx one.com)
- Status: `NÃ¸dvendig` for custom domÃ¦ne
- FormÃ¥l:
  - Pege domÃ¦net korrekt pÃ¥ Vercel
  - DNS records til email (SPF/DKIM/DMARC via Resend)
- Typiske fejl:
  - DomÃ¦net viser "Invalid configuration"
  - Email deliverability-problemer

---

## Minimum setup for at appen virker end-to-end
1. Vercel + korrekt env vars
2. PostgreSQL + migrationer
3. Stripe (inkl. webhook secret + price IDs)
4. Mux (inkl. webhook secret)
5. Resend + verified sender domain
6. NextAuth korrekt sat op (og Google OAuth hvis Google-login Ã¸nskes)

## Hurtig driftstjek ved nye deploys
1. Kan du logge ind
2. Kan du oprette projekt
3. Kan du starte checkout
4. Kommer invite-mails frem
5. Bliver uploadede videoer playable

## Relateret driftsdokumentation
- Backup og restore guide: `docs/backup-restore.md`



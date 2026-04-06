# External Services for Neutral Player
## Document Version
- Current release: v0.3.0
- Last updated: 2026-04-06

Denne fil er en samlet oversigt over de eksterne tjenester, som Neutral Player bruger.

## 1) Vercel (Hosting + Deploy)
- Status: `Noedvendig`
- Formaal:
  - Hoste appen (Next.js)
  - Koere builds og deployments
  - Miljoevariabler (Environment Variables)
- Kraever:
  - Kode deployet til korrekt Vercel-projekt
  - Alle noedvendige env vars sat i korrekt miljoe (`Preview` og/eller `Production`)
- Typiske fejl:
  - "env var mangler" i API-ruter
  - Forskellig opfoersel mellem localhost og Vercel pga. manglende env-scope

## 2) Database (PostgreSQL, fx Neon eller Supabase)
- Status: `Noedvendig`
- Formaal:
  - Gemme brugere, organisationer, projekter, varianter, billing og audit logs
- Kraever:
  - `DATABASE_URL`
  - Prisma migrationer koert (`prisma migrate deploy`)
- Typiske fejl:
  - Prisma runtime-fejl
  - Manglende tabeller eller kolonner hvis migration ikke er koert

## 3) Stripe (Betaling + abonnement)
- Status: `Noedvendig` for betalt SaaS-flow
- Formaal:
  - Checkout
  - Kundeportal
  - Webhooks til synk af subscription-status
- Kraever:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
  - `STRIPE_WEBHOOK_SECRET`
- Vigtigt:
  - Stripe key og price IDs skal vaere fra samme mode (test eller live)
- Typiske fejl:
  - Checkout starter ikke
  - Forkerte priser i UI
  - Webhook-events synker ikke abonnement korrekt

## 4) Mux (Video upload + playback + webhook)
- Status: `Noedvendig` for videofunktionalitet
- Formaal:
  - Oprette uploads
  - Modtage playback IDs
  - Afspille video via embed
- Kraever:
  - `MUX_TOKEN_ID`
  - `MUX_TOKEN_SECRET`
  - `MUX_WEBHOOK_SECRET`
- Typiske fejl:
  - Upload fejler
  - Video bliver ikke klar
  - Webhook-signatur fejler

## 5) Resend (Transaktionelle emails)
- Status: `Noedvendig` for invite-, verify- og kontaktflow
- Formaal:
  - Sende invitationsmails
  - Sende email-verificering
  - Sende beskeder fra kontaktformular
- Kraever:
  - `RESEND_API_KEY`
  - `INVITE_FROM_EMAIL`
  - `VERIFY_FROM_EMAIL`
  - `CONTACT_TO_EMAIL`
  - Valgfrit: `CONTACT_FROM_EMAIL`
- Typiske fejl:
  - Invitation oprettes men mail sendes ikke
  - Verify-flow kraever manuel fallback-link

## 6) Google OAuth (Login med Google)
- Status: `Valgfri`, men noedvendig hvis Google-login skal virke
- Formaal:
  - Social login via NextAuth
- Kraever:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_URL` sat korrekt per miljoe
  - Korrekte OAuth redirect URIs i Google Cloud Console
- Typiske fejl:
  - `redirect_uri_mismatch`
  - Login virker lokalt men ikke paa custom domaene

## 7) NextAuth (Auth/session)
- Status: `Noedvendig`
- Formaal:
  - Login og session-haandtering (credentials + Google)
- Kraever:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (lokalt: `http://localhost:3000`, prod: dit domaene)
- Typiske fejl:
  - Login eller session fejler eller looper

## 8) Sentry (Observability)
- Status: `Anbefalet`
- Formaal:
  - Fejlsporing i frontend og backend
  - Hurtigere debugging i produktion
- Kraever:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - Valgfrit: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` til source maps
- Typiske fejl:
  - Fejl optraeder i produktion uden sporbarhed

## 9) DNS og domain provider
- Status: `Noedvendig` for custom domaene
- Formaal:
  - Pege domaenet korrekt paa Vercel
  - DNS records til email (SPF, DKIM, DMARC via Resend)
- Typiske fejl:
  - Domaenet viser "Invalid configuration"
  - Email deliverability-problemer

---

## Minimum setup for at appen virker end-to-end
1. Vercel med korrekte env vars
2. PostgreSQL med migrationer
3. Stripe, inkl. webhook secret og price IDs
4. Mux, inkl. webhook secret
5. Resend med verified sender domain
6. NextAuth sat korrekt op

## Hurtig driftstjek ved nye deploys
1. Kan du logge ind
2. Kan du oprette projekt
3. Kan du starte checkout
4. Kommer invite-mails frem
5. Bliver uploadede videoer playable
6. Kommer Sentry-events og structured logs frem som forventet

## Relateret driftsdokumentation
- Backup og restore guide: `docs/backup-restore.md`
- Sentry setup: `docs/sentry-setup.md`
- Theme rollout: `docs/theme-rollout.md`

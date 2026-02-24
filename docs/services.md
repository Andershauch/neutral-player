# External Services for Neutral Player
## Document Version
- Current release: v0.2.1
- Last updated: 2026-02-22


Denne fil er en samlet oversigt over de eksterne tjenester, som Neutral Player bruger.

## 1) Vercel (Hosting + Deploy)
- Status: `Nødvendig`
- Formål:
  - Hoste appen (Next.js)
  - Køre builds og deployments
  - Miljøvariabler (Environment Variables)
- Kræver:
  - Kode deployet til korrekt Vercel-projekt
  - Alle nødvendige env vars sat i korrekt miljø (`Preview` og/eller `Production`)
- Typiske fejl:
  - "env var mangler" i API-ruter
  - Forskellig opførsel mellem localhost og Vercel pga. manglende env-scope

## 2) Database (PostgreSQL, fx Neon/Supabase)
- Status: `Nødvendig`
- Formål:
  - Gemme brugere, organisationer, projekter, varianter, billing, audit logs osv.
- Kræver:
  - `DATABASE_URL`
  - Prisma migrationer kørt (`prisma migrate deploy`)
- Typiske fejl:
  - Prisma runtime-fejl
  - Manglende tabeller/kolonner hvis migration ikke er kørt

## 3) Stripe (Betaling + abonnement)
- Status: `Nødvendig` for betalt SaaS-flow
- Formål:
  - Checkout
  - Kundeportal
  - Webhooks til synk af subscription-status
- Kræver:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_WEBHOOK_SECRET`
- Vigtigt:
  - Stripe key og price IDs skal være fra samme mode (test/live)
- Typiske fejl:
  - Checkout starter ikke
  - Forkerte priser i UI (fallback-labels)
  - Webhook-events synker ikke abonnement korrekt

## 4) Mux (Video upload + playback + webhook)
- Status: `Nødvendig` for videofunktionalitet
- Formål:
  - Oprette uploads
  - Modtage playback IDs
  - Afspille video via embed
- Kræver:
  - `MUX_TOKEN_ID`
  - `MUX_TOKEN_SECRET`
  - `MUX_WEBHOOK_SECRET`
- Typiske fejl:
  - Upload fejler
  - Video bliver ikke "klar" (playback ID mangler)
  - Webhook-signatur fejler

## 5) Resend (Transaktionelle emails)
- Status: `Nødvendig` for invite- og verify-email flow
- Formål:
  - Sende invitationsmails
  - Sende email-verificering
  - Sende beskeder fra kontaktformular
- Kræver:
  - `RESEND_API_KEY`
  - `INVITE_FROM_EMAIL`
  - `VERIFY_FROM_EMAIL`
  - `CONTACT_TO_EMAIL`
  - (valgfrit) `CONTACT_FROM_EMAIL`
- Typiske fejl:
  - Invitation oprettes men mail sendes ikke
  - Verify-flow kræver manuel fallback-link

## 6) Google OAuth (Login med Google)
- Status: `Valgfri`, men nødvendig hvis Google-login skal virke
- Formål:
  - Social login via NextAuth
- Kræver:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_URL` sat korrekt per miljø
  - Korrekte OAuth redirect URIs i Google Cloud Console
- Typiske fejl:
  - `redirect_uri_mismatch`
  - Login virker lokalt men ikke på custom domæne

## 7) NextAuth (Auth/session)
- Status: `Nødvendig`
- Formål:
  - Login/session-håndtering (credentials + Google)
- Kræver:
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (lokalt: `http://localhost:3000`, prod: dit domæne)
- Typiske fejl:
  - Login/session fejler eller loops

## 8) Sentry (Observability)
- Status: `Anbefalet` (nu implementeret)
- Formål:
  - Fejlsporing i frontend/backend
  - Hurtigere debugging i produktion
- Kræver:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - (valgfrit) `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` til source maps
- Typiske fejl:
  - Fejl optræder i produktion uden sporbarhed

## 9) DNS/Domain provider (fx one.com)
- Status: `Nødvendig` for custom domæne
- Formål:
  - Pege domænet korrekt på Vercel
  - DNS records til email (SPF/DKIM/DMARC via Resend)
- Typiske fejl:
  - Domænet viser "Invalid configuration"
  - Email deliverability-problemer

---

## Minimum setup for at appen virker end-to-end
1. Vercel + korrekt env vars
2. PostgreSQL + migrationer
3. Stripe (inkl. webhook secret + price IDs)
4. Mux (inkl. webhook secret)
5. Resend + verified sender domain
6. NextAuth korrekt sat op (og Google OAuth hvis Google-login ønskes)

## Hurtig driftstjek ved nye deploys
1. Kan du logge ind
2. Kan du oprette projekt
3. Kan du starte checkout
4. Kommer invite-mails frem
5. Bliver uploadede videoer playable



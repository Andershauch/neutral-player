# Sentry setup (Neutral Player)

## 1) Opret projekt i Sentry
1. Log ind i Sentry.
2. Opret et nyt projekt til Next.js.
3. Kopiér DSN-værdien.

## 2) Sæt environment variables
Sæt disse i både lokal `.env.local` og i Vercel:

```env
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_DSN=...
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

Kun hvis du vil uploade source maps automatisk under build:

```env
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

## 3) Deploy og test
1. Deploy til preview/production.
2. Fremprovokér en fejl (fx i en route) og bekræft event i Sentry.
3. Kontrollér at events indeholder request-id fra appens strukturerede logs.

## Noter
- Uden `SENTRY_AUTH_TOKEN` virker error-capture stadig, men source maps uploades ikke.
- Sample rate `0.1` er et godt startpunkt; skru op/ned efter behov.

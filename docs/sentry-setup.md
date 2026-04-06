# Sentry setup (Neutral Player)

## 1) Opret projekt i Sentry
1. Log ind i Sentry.
2. Opret et nyt projekt til Next.js.
3. Kopier DSN-vaerdien.

## 2) Saet environment variables
Saet disse i baade lokal `.env.local` og i Vercel:

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
1. Deploy til preview eller production.
2. Fremprovoker en fejl, fx i en route, og bekraeft event i Sentry.
3. Kontroller at events kan korreleres med appens structured logs via `requestId`.

## 4) Theme runtime alert
Brug denne alert til `TASK-7.9` runtime-monitorering:

1. Opret en issue alert eller metric alert i Sentry for production-miljoet.
2. Filtrer paa event message `Invalid theme payload detected`.
3. Indsnaevr gerne med tag `themeSubsystem=runtime-resolve`.
4. Saet threshold til gentagne events over et kort vindue, fx 5 events paa 10 minutter.
5. Send alerten til den kanal teamet faktisk overvager, fx email eller Slack.

Anbefalet reaktion naar alerten gaar:
1. Find det berorte `themeId`, `organizationId` og `scope` i Sentry eventen.
2. Bekraeft samme `requestId` eller metadata i structured logs.
3. Roll tilbage til seneste kendte gode theme fra `/internal`, eller bed kunden publicere en korrigeret draft.
4. Hold alerten aaeben indtil warning-volumen er normaliseret.

## Noter
- Uden `SENTRY_AUTH_TOKEN` virker error-capture stadig, men source maps uploades ikke.
- Sample rate `0.1` er et godt startpunkt; skru op eller ned efter behov.
- Theme runtime warnings bruger message `Invalid theme payload detected` og tags for scope og runtime-subsystem, saa alerting kan holdes snaevert paa det relevante signal.

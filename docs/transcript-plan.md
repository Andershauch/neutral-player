# Plan: Tilgængelig tekstversion (transskription) i embed

Status: Plan godkendt af Anders 2026-11-17. Ingen kode skrevet endnu. Næste skridt er 0.

## Baggrund
- 1 embed pr. video med 5 varianter (da, en, pl, uk, ar), hver med egen Mux-video. VTT-undertekster uploades allerede pr. variant (`VariantSubtitle`) og kommer ud som `<track>`.
- Testdata: `C:\Projekter\Neutralplayer\videoer\fleksjob\fleksjob.transcript.json` (alle 5 sprog). `fleksjob.transkription.html` i samme mappe viser den ønskede HTML-struktur.
- Datafilen laves af skillen "video-transskription" og `videoer\_vaerktoej\build_transcript.py`. Format: `languages.<lang>` har `summary`, `speaker`, `languageName`, `cueCount` og `sections[]` med `heading` og `blocks[]` (`type: "visual"` med `text`, eller `type: "speech"` med `text` og `cues`). Topniveau har også `review` og `reviewIntro` (interne korrekturnoter).
- Besluttet retning: "alt i én"-embed. Under videoen er der en `<details>`/`<summary>` med teksten "Læs tekstversion". Transskriptionen følger det sprog, der er valgt i afspilleren. Redaktøren indsætter kun én embed-kode.

## Beslutninger
- **Lagring pr. variant:** `Variant.transcript Json?`. Det følger sprogversionen ligesom undertekster og er entydigt, når der er flere grupper.
- **Én upload pr. embed:** Filen fordeles til varianterne efter `lang`. Det giver 24 uploads i stedet for 120.
- **Resize-script hostes** som `public/embed-resize.js`. Scriptet er valgfrit i embed-koden.
- **Ingen Neon-branch:** Systemet har ingen kunder endnu, så migrationen kører direkte.

## Fund i koden, der påvirker løsningen
- Den nuværende embed-kode er præcis 16:9 (`padding-top:56.25%`). En knap under videoen bliver skåret af i gamle embeds. Derfor krymper videoområdet, så knaprækken altid kan ses.
- `review` og `reviewIntro` må ikke gemmes eller vises.
- Filen har intet `dir`-felt. Retningen regnes ud fra sprogkoden (ar, fa, he, ur → rtl).
- Iframens `documentElement.scrollHeight` bliver aldrig mindre end iframens højde. Mål derfor højden på `main` (getBoundingClientRect), ellers kan iframen ikke krympe igen.
- Fuldskærm bruger afspillerens `containerRef` og påvirkes ikke af layoutet.
- `build` er `prisma generate && next build` og kører **ikke** `prisma migrate deploy`. Migrationen skal køres manuelt (`npm run db:migrate:deploy`) **før** koden pushes.
- `next.config.ts` har `ignoreBuildErrors: true`. Det er CI's typecheck, der fanger typefejl, ikke Vercel.
- Branchen hedder `main`. CI kører ved push til `main`.

## 1. Datamodel
```sql
ALTER TABLE "Variant" ADD COLUMN "transcript" JSONB;
```
Der gemmes kun: `languageName`, `summary`, `speaker`, `sections[].heading`, `sections[].blocks[].type/text/cues`.

## 2. Upload i admin
- Nyt `CollapsibleSection` "Tekstversion (transskription)" i `EmbedEditor`, mellem versionsbiblioteket og domæneindstillingerne.
- `POST /api/embeds/[id]/transcript`: validering, fordeling efter `lang` i én transaktion, `getOrgContextForContentEdit`, rate limit, størrelsesgrænse og audit-log (`TRANSCRIPT_UPLOADED`). Samme mønster som `app/api/variants/[id]/subtitles/upload/route.ts`.
- Svaret giver status pr. sprog samt "sprog i filen uden video" og "video uden tekst".
- `DELETE` på samme rute fjerner teksten.
- Valideringen ligger i `lib/transcript.ts` med unit tests, ligesom `lib/subtitles.ts`.

## 3. Visning i embed
- `app/embed/[id]/page.tsx` henter `transcript` pr. variant. Har ingen variant tekst, er siden uændret.
- `TranscriptDetails`: `<details lang dir>`, `<summary>` på sprogets egen tekst, `h2` til sektionsoverskrifter (iframen er sit eget dokument), visuelle beskrivelser som `<p><em>[…]</em></p>` og tale som `<p><strong>Fortæller:</strong> …</p>`. Al tekst vises som almindelig tekst og aldrig som HTML.
- Komponenten ligger i `MuxPlayerClient` og følger `activeVariant`. Åben/lukket gemmes i state, så teksten bliver ved med at være åben ved sprogskift.
- Layout i en kolonne: video øverst og knaprække under. Videoen krymper, så knaprækken altid kan ses.

## 4. Højde og embed-kode
- Inde i iframen sender en `ResizeObserver` på `main` beskeden `{ type: "neutralplayer:height", height }` til `parent`. Det sker kun, når siden kører i en iframe.
- `public/embed-resize.js` (ca. 30 linjer):
  - læser origin fra sin egen `src`,
  - tjekker `event.origin` og `event.source`,
  - begrænser højden til et fornuftigt interval,
  - skifter wrapperen fra `padding-top` til en fast højde i pixel,
  - registrerer kun én listener, også ved flere embeds på samme side,
  - bruger ingen cookies og ingen tracking.
- Uden script åbner teksten inde i iframen med egen rullebjælke.
- Ny embed-kode:
```html
<div style="position:relative;padding-top:calc(56.25% + 3.5rem);width:100%;overflow:hidden;border-radius:12px;background:#000;">
  <iframe src="https://…/embed/ID" loading="lazy"
    style="position:absolute;inset:0;width:100%;height:100%;border:none;"
    allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video: Fleksjob"></iframe>
</div>
<script src="https://…/embed-resize.js" async></script>
```
- `[USIKKERT]` om halsnaes.dk tillader script. Løsningen skal virke i begge tilfælde.

## 5. Test
- Unit (Vitest): `lib/transcript.ts` skal afvise forkert form og for store filer, fjerne `review` og give `ar` → rtl.
- `scripts/embed-host-test.html` køres på en anden port (andet origin) med to embeds, én med script og én uden. Den kommer ikke med i deploy.
- Tjekliste:
  - Tastatur: fokus er synligt, Enter og Mellemrum folder ud, og fokusrækkefølgen er rigtig.
  - Attributter: `lang` og `dir` på `<details>`, iframe-`title` og overskriftsniveauer.
  - 390 px: ingen vandret rulning, og knaprækken er ikke skåret af (polsk og ukrainsk summary er længst). Knappen er mindst 44 px.
  - Arabisk: tekst og tegnsætning står rigtigt fra højre mod venstre.
  - Zoom til 200 %.
  - Gammel embed-kode med transskription.
  - Sprogskift med åben tekst.
  - Ingen fejl i konsollen.
- lint, typecheck, `npm run test` og build. Kør ikke `test:e2e:external`.

## Rækkefølge
0. Tilføj TASK-12.12 og en idébank-sektion i `docs/saas-roadmap.md`.
1. `lib/transcript.ts` med unit tests.
2. Migration: kør `npm run db:migrate:deploy` før push.
3. Upload-API.
4. Admin-afsnit. Anders tester.
5. Visning i embed og sprogskift. Anders tester uden script.
6. Højdebeskeder, `embed-resize.js` og ny embed-kode i `EmbedCodeGenerator`. Anders tester med script.
7. Den samlede tjekliste.

## Idébank (bygges ikke nu)
- Sprogknapperne viser kun "UK"/"AR", og skærmlæsere siger "U K". De skal have et tilgængeligt navn (fx "Українська") og `lang` på knappen.
- Det valgte sprog mangler `aria-pressed`.
- Sprogknapperne bliver usynlige efter 3 sekunder, men kan stadig få tastaturfokus. De skal vises ved fokus (`:focus-within`), eller også skal de ikke skjules.
- `app/layout.tsx` sætter `maximumScale: 1, userScalable: false`, som blokerer zoom i admin (WCAG 1.4.4). Det påvirker sandsynligvis ikke iframen `[USIKKERT: test på iOS]`.
- Ekstra fallback: et link til tekstversionen på egen side (`/embed/[id]/tekst?lang=xx`).
- Klik på en talblok for at hoppe i videoen. `cues` gemmes allerede.

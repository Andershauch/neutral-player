# Theme Boundary

## Formål

Denne side dokumenterer, hvad en kundes eget tema (self-service branding, `/admin/profile/branding`) må ændre i NeutralPlayer, og hvad der altid forbliver systemets eget. Grænsen er allerede håndhævet i kode i dag — denne side skriver den ned, så den er tydelig for både produkt og fremtidige ændringer, i stedet for kun at leve som implicit adfærd i `lib/theme-schema.ts`.

**Princip:** Kundebranding må farve accent/surface-niveauet oven på systemet. Den må ikke splitte layout, navigation, spacing eller komponenthierarki i tre forskellige design (jf. `docs/saas-roadmap.md`s SPRINT-11-princip).

## Hvor grænsen håndhæves

- `lib/theme-schema.ts`s `ThemeTokens`-interface definerer **hele** overfladen, en tema-payload kan indeholde. Der findes ingen `layout`-, `navigation`-, `spacing`- eller `hierarchy`-felter i skemaet — de er strukturelt umulige at sende med et tema, uanset rolle.
- `validateCustomerThemeTokens()` lægger et **andet, strammere** lag oven på selve skemaet, specifikt for kunde-selvbetjening: den låser en håndfuld felter til platformens egen baseline, selvom de teknisk findes i `ThemeTokens`.
- Denne strammere validering bruges kun i `app/api/branding/theme/route.ts` (kunde-selvbetjening under `/admin/profile/branding`). Den interne rute `app/api/internal/branding/theme/route.ts` (bruges af NeutralPlayer-staff til globale defaults og enterprise-overrides) bruger den løsere `validateThemeTokens()` uden det ekstra lås-lag — internal kan sætte alt, hvad skemaet tillader, på vegne af en kunde.

## Hvad en kundes eget tema må ændre

Via `ThemeTokens` og ikke låst af `validateCustomerThemeTokens`:

- **Accentfarver**: `colors.primary`, `colors.primaryStrong`, samt de neutrale overflade-farver `colors.background`, `colors.surface`, `colors.foreground`, `colors.muted`, `colors.line`.
- **Font**: `typography.fontFamily` (begrænset til en allow-list: Apex New, Inter, Roboto, Source Sans 3, Manrope — `ALLOWED_FONT_FAMILIES` i `lib/theme-schema.ts`).
- **Radius**: `radius.card`, `radius.pill` (kosmetisk afrunding, ikke layout).
- **Player skin**: `player.playButtonBg/-Border/-HoverBg/-HoverBorder`, `player.controlBg/-Border/-HoverBg` — selve afspiller-kontrolbjælkens farver (se `--np-player-*`-tokens i `app/globals.css` og `lib/theme-css.ts`).
- **Logo/billeder**: styres uden for `ThemeTokens` via de separate branding-asset-felter (ikke en del af denne temaflade).

## Hvad et kundetema aldrig kan ændre, fordi skemaet ikke har feltet

Layoutstruktur, navigation, spacing-system og komponenthierarki findes slet ikke i `ThemeTokens` — de er ikke "låste", de er fraværende. Et tema kan kun sætte farver, en font, to radius-værdier og player-skin-farver; intet andet kan udtrykkes i payloaden overhovedet.

## Hvad der er farve-agtigt, men alligevel er låst for kunde-selvbetjening

`validateCustomerThemeTokens()`'s eksplicitte lås-liste — disse felter *findes* i `ThemeTokens` og *kunne* i princippet sættes, men afvises hvis en kundes payload afviger fra platform-baseline:

- `colors.successBg`, `colors.successFg`, `colors.warningBg`, `colors.warningFg`, `colors.danger` — systemets status-farver (success/warning/danger) skal betyde det samme på tværs af alle kunder.
- `typography.headingWeight`, `typography.bodyWeight` — type-vægt er en del af det delte typografiske hierarki, ikke brand.
- `shadows.card` — kort-skyggen er en system-token, ikke en brand-detalje.
- `player.playButtonShadow` — samme princip som `shadows.card`, for afspillerens play-knap.

Disse er alle allerede håndhævet af `assertLockedField()` i `lib/theme-schema.ts:169-177`. Hvis en kunde sender en payload, der afviger på et af disse felter, afvises hele temaet med en valideringsfejl.

## Systemlåste shell-tokens (adskilt problem, se TASK-11.2)

Ud over `ThemeTokens`-grænsen findes en anden, CSS-niveau grænse: `app/globals.css`s "shell"-tier-tokens (`--np-shell-*`, `--np-panel-*`, `--np-hero-overlay`, `--np-quiet-link*`) er kun erklæret i `.np-default-theme` (den statiske public/auth-skin) og udsendes bevidst **ikke** af `lib/theme-css.ts`s `buildThemeCssVars()`. De kan derfor slet ikke nås af noget kundetema, uanset rolle — heller ikke via den interne rute. Se token-hierarki-kommentaren i `app/globals.css`s `:root`-blok for den fulde forklaring.

## Hvis grænsen skal ændres

Hvis et nyt felt skal være tema-bart:
1. Tilføj det til `ThemeTokens` i `lib/theme-schema.ts`, med validering i `validateThemeTokens()`.
2. Beslut eksplicit, om kunde-selvbetjening skal have adgang til det, eller om det skal låses i `validateCustomerThemeTokens()` — lås er default for alt, der er systemidentitet snarere end brand.
3. Opdater denne side, så listerne ovenfor stadig stemmer med koden.

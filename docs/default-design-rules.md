# Default Design Rules
## Purpose

Denne guide beskriver de vigtigste regler for public/default flader i NeutralPlayer.
Maalet er ikke at lave et stort design-system. Maalet er at holde marketing, auth og system-sider i samme familie, mens det stadig er let at skifte look senere.

## Scope

Reglerne gaelder for:
- marketing-sider
- auth-sider
- verify, invite og andre ikke-theme-overstyrede system-sider

Reglerne gaelder ikke for:
- enterprise theme overrides
- interne admin-flader med separat funktionelt behov

## Core principle

Skil struktur fra look.

Det betyder i praksis:
- behold layout og section-typer stabile
- saml visuel retning i fa tokens og approved classes
- undgaa side-for-side one-off styling

Hvis vi senere vil gae i en anden marketing-retning, skal vi primært kunne skifte tokens, kort-varianter og section-kompositioner uden at omskrive flows.

## Layout rules

### 1. Brug shared shells
- marketing/default sider bruger `np-default-theme` + `np-page-shell`
- auth/system sider bruger `np-default-theme` + `np-form-shell`
- guided auth/system sider bruger `np-form-layout`

### 2. Brug faa section-typer
- `np-section-card` er standard stor sektion
- `np-section-card-muted` er sekundær sektion eller supporting panel
- `np-form-card` er primær formular/systemflade
- `np-form-aside` er venstrestillet kontekst og guidance

### 3. Hold rytmen enkel
- byg sider som en stak af sektioner med tydelig vertikal luft
- lad hver sektion have ét primært job
- undgaa at blande hero, prisforklaring, FAQ og flere CTA-lag i samme blok uden klar hierarki

## Typography rules

### 1. Heading hierarchy
- brug `np-kicker` eller `np-form-kicker` til lille kontekst-label
- brug store uppercase headlines til hovedbudskabet
- brug `np-support-copy` eller `np-form-copy` til forklarende tekst

### 2. Hold copy rolig
- én klar hovedpointe per sektion
- brug korte støttende afsnit i stedet for lange tekstvægge
- public copy må gerne være sales-led, men ikke fyldt med buzzwords

### 3. Skriv dansk ordentligt
- danske tegn skal bruges korrekt: `æ ø å`
- undgaa fallback-staveformer som `ae`, `oe`, `aa`, medmindre det er i tekniske identifikatorer
- hvis copy ser korrupt ud, ret teksten i kilden i stedet for at style sig ud af problemet

## CTA rules

### 1. Tre niveauer er nok
- `np-btn-primary`: primær beslutning eller næste skridt
- `np-btn-ghost`: sekundær alternativ handling
- `np-link-quiet`: lav-intensitets navigation eller escape hatch

### 2. Kun én primær CTA per lokal beslutning
- hver sektion bør have en tydelig primær retning
- hvis der er to knapper, skal det være tydeligt hvilken der er default
- undgaa tre lige stærke CTA'er i samme blok

### 3. CTA copy skal være konkret
- skriv `Se planer`, `Kontakt salg`, `Fortsæt til setup`, `Acceptér invitation`
- undgaa generiske labels som `Læs mere` hvis næste skridt er vigtigere

## Surface and card rules

### 1. Hold dig til approved surfaces
- brug `np-section-card`, `np-section-card-muted`, `np-form-card`, `np-data-chip`
- undgaa nye card-styles med lokale border, shadow og radius-værdier uden god grund

### 2. Brug tokens før raw farver
- brug eksisterende classes og token-baserede utilities
- hvis et nyt mønster er nødvendigt, læg det i `app/globals.css` som en delt primitive
- undgaa at farvestyre marketing-sider med mange tilfældige utility-kæder

### 3. System-status skal være ens
- succes, info og fejl bruger `np-status-banner-*`
- auth og system-flader bør ikke opfinde egne alert-behandlinger per side

## Marketing rules

### 1. Prioritér servicevalg
- forsiden skal hjælpe brugeren med at forstå hvilken type service eller løsning der passer
- pricing og contact skal føles som naturlige næste skridt fra landing

### 2. Giv salg en legitim plads
- `Kontakt salg` må gerne være tidligt i flowet
- enterprise og komplekse valg bør føles rådgivende, ikke skjulte

### 3. Brug historier som beslutningsstøtte
- kundehistorier skal understøtte servicevalg og troværdighed
- historier må gerne være korte, men bør pege på et konkret udfald

## Auth and system page rules

### 1. Giv kontekst før formularen
- auth/system sider må gerne have en venstre kolonne med guidance
- forklar hvad brugeren er ved at gøre, og hvad næste skridt er

### 2. Hold formularen ren
- brug `np-field` og `np-textarea`
- undgaa ekstra pynt i formularen
- lad vigtig status og handling være tydeligere end sekundære links

### 3. Hjælp brugeren ud af blindgyder
- invite, unauthorized og verify sider skal altid pege videre
- der skal være en tydelig fallback-handling som forside, login, setup eller kontakt

## Change rules

Før du laver ny public/default UI:
1. start med eksisterende primitives
2. tilføj kun nye classes hvis mindst to flader har brug for mønsteret
3. læg nye shared regler i `app/globals.css`
4. opdater denne guide hvis retningen ændrer sig

## Quick checklist

En ny public/default side er klar når:
- den bruger shared shell
- den har tydelig kicker, headline og support copy
- dens CTA-hierarki er klart
- den bruger approved cards og fields
- teksten er korrekt på dansk
- næste skridt er tydeligt for brugeren

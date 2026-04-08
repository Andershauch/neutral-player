# Journey Guardrails
## Formål
- Holde brugerrejsen sammenhængende på tværs af public, guided/auth, customer admin og internal.
- Gøre det tydeligt hvilken navigationstype, CTA-retning og tilbagevej hver side skal have.

## Shell-regler
### Public shell
- Bruges til:
  - landing
  - pricing
  - faq
  - contact
- Skal have:
  - topnavigation
  - tydelig primær CTA
  - klar bro til kontakt, planvalg eller konto-oprettelse

### Guided system shell
- Bruges til:
  - login
  - register
  - verify-email
  - setup/workspace
  - invite
  - unauthorized
- Skal have:
  - let public-orientering
  - tydelig sideintro
  - én primær næste handling
  - sikker tilbagevej til public eller relevant app-kontekst

### Customer admin shell
- Bruges til:
  - dashboard
  - projects
  - team
  - billing
  - profile
  - audit
  - branding
  - embed editor
- Skal have:
  - vedvarende venstremenu
  - page header med klar sidefunktion
  - breadcrumb på dybe arbejdssider

### Internal shell
- Bruges til:
  - internal home
  - marketing
  - internal preview
  - senere governance og support tools
- Skal have:
  - egen navigation
  - tydelig aktiv værktøjskontekst
  - customer admin som bevidst exit, ikke primær navigation

## CTA-regler
- Hver vigtig side skal have én primær næste handling.
- Sekundære handlinger må støtte orientering, men ikke konkurrere med hovedopgaven.
- Hvis en side er task-tung, skal CTA'en pege på næste logiske trin i flowet.

## Breadcrumb-regler
- Brug breadcrumb på:
  - dybe admin-sider
  - projekt/embed editor
  - internal værktøjssider og preview
- Undgå breadcrumb på:
  - landing
  - pricing
  - top-level dashboard
  - simple auth-flader

## Tilbagevejs-regler
- "Tilbage" må pege på dashboard kun når dashboard reelt er forældresiden.
- Projekteditor skal pege tilbage til projekter eller onboarding, ikke bare generisk admin.
- Internal preview skal pege tilbage til internal editoren, ikke direkte til live public-siden.

## Næste-skridt-regler
- Public:
  - vælg plan
  - kontakt salg
  - opret konto
- Guided:
  - fortsæt til næste onboarding-step
- Customer admin:
  - opret projekt
  - fortsæt onboarding
  - del embed når video er klar
- Internal:
  - vælg værktøj
  - preview før publish
  - rollback hvis live skal genskabes

## Verifikation
- Public smoke skal verificere shared før-login shell på landing, pricing, login og register.
- Kritiske produktrejser skal have mindst én automatisk verifikation:
  - signup til første embed
  - internal marketing draft til preview
- Når en side ændres, skal vi kontrollere:
  - hvilken shell den tilhører
  - om primær CTA stadig er tydelig
  - om tilbagevejen stadig giver mening

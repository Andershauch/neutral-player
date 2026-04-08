# Marketing Content Runbook

Denne runbook beskriver den sikre arbejdsgang for `np_super_admin`, når marketing-sider skal opdateres uden kodeændringer.

## Scope

V1 dækker disse public sider:

- `home`
- `pricing`
- `faq`
- `contact`

Indhold styres i internal editoren på [app/internal/marketing/page.tsx](/C:/Users/ander/neutral-player/app/internal/marketing/page.tsx).

## Roller

- `np_super_admin`
  - Kan gemme draft
  - Kan uploade assets
  - Kan publicere
  - Kan rollbacke
- `np_support_admin`
  - Kan læse content
  - Kan åbne preview
  - Kan ikke gemme, publicere eller rollbacke

## Normal arbejdsgang

1. Åbn internal marketing editor.
2. Vælg den relevante side.
3. Opdater sektionerne i editoren.
4. Tilføj en kort `change summary`, så historikken bliver læsbar.
5. Brug lokal preview til hurtig validering.
6. Åbn den dedikerede draft preview for at se den gemte draft separat fra live.
7. Kontrollér links, CTA'er, stories og assets.
8. Publicér først når previewen ser rigtig ud.

## Assets

- Brug kun billeder i de understøttede formater i v1.
- Alt-tekst er påkrævet.
- Brug de genererede `assetKey` værdier i content-sektionerne.
- Kontrollér ratio-guidance i editoren før publish.

## Publish og rollback

- Publish gør den aktive draft til ny live version.
- Den tidligere live version arkiveres automatisk.
- Rollback bruges hvis den seneste live version skal erstattes af en tidligere publiceret version.
- Rollback må ikke bruges mod drafts.

## Fallbacks

- Hvis draft eller published content er ugyldigt, falder preview og public runtime tilbage til sikre defaults.
- Hvis editor-data mangler helt, bruger public sider stadig kode-defaults.
- Hvis et asset mangler, skal den relevante side rettes og publiceres igen. Runtime-fallbacks beskytter mod hard crashes.

## Hvad man skal tjekke før publish

- Hero-copy passer til siden og næste CTA.
- Links går til de rigtige destinationssider.
- Kundehistorier er komplette og troværdige.
- Kontakt- og FAQ-copy er stadig på dansk og uden encoding-fejl.
- Eventuelle nye billeder har korrekt alt-tekst.

## Observability

Disse hændelser skal kunne spores:

- `INTERNAL_MARKETING_DRAFT_SAVED`
- `INTERNAL_MARKETING_ASSET_UPLOADED`
- `INTERNAL_MARKETING_PAGE_PUBLISHED`
- `INTERNAL_MARKETING_PAGE_ROLLED_BACK`

Hvis preview eller runtime falder tilbage til defaults, logges det som warning i server-outputtet.

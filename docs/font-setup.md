# Apex New Font Setup

Denne app forventer lokale fontfiler i:

- `public/fonts/apex-new-400.ttf`
- `public/fonts/apex-new-700.ttf`

## Sådan gør du

1. Eksportér eller hent `Apex New` som `.ttf` i vægte `400` og `700`.
2. Opret mappen `public/fonts` hvis den ikke findes.
3. Læg filerne ind med præcis disse navne:
   - `apex-new-400.ttf`
   - `apex-new-700.ttf`
4. Genstart dev-serveren (`npm run dev`), så browseren loader de nye fontfiler.

## Noter

- Overskrifter bruger `700` + uppercase via globale styles.
- Brødtekst bruger `400` via globale styles.
- Hvis en fil mangler, falder browseren tilbage til systemfont.

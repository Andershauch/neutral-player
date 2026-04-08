# Encoding Policy

Alle tekstfiler i projektet skal gemmes som UTF-8 uden BOM og med LF-linjeskift.
Det gaelder ogsaa for danske tegn som `ae`, `oe`, `aa`, `æ`, `ø` og `å`.

## Guardrails

- `.editorconfig` saetter `charset = utf-8` og `end_of_line = lf`
- `.gitattributes` holder tekstfiler paa LF i git
- `.vscode/settings.json` tvinger UTF-8 og slaar encoding-gæt fra i editoren
- `npm run encoding:check` afviser BOM, ugyldig UTF-8, CRLF og typiske mojibake-sekvenser
- `npm run encoding:fix` normaliserer tekstfiler til UTF-8 uden BOM og LF

## Brug i praksis

1. Skriv danske tegn direkte i kildefilerne, naar det giver mening.
2. Koer `npm run encoding:check` foer commit, hvis du har arbejdet i docs eller copy.
3. Koer `npm run encoding:fix` hvis en fil er blevet gemt med forkert encoding eller linjeskift.
4. Hvis checken finder mojibake, ret teksten i filen i stedet for at omgaa checken.

## Reference

Eksempeltekst til hurtig kontrol: `æ ø å Æ Ø Å`.

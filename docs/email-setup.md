# Email Setup (Resend + Vercel)

Denne guide sætter email op til:
- verificering af email ved signup
- invitationer til teammedlemmer

## 1. Krav
- Du har en Resend-konto
- Du har adgang til DNS for dit domæne (fx Cloudflare, One.com, Simply, GoDaddy)
- Du har adgang til Vercel projektets Environment Variables

## 2. Opret og verificér domæne i Resend
1. Gå til Resend dashboard.
2. Tilføj dit domæne (fx `ditdomæne.dk`).
3. Kopiér de DNS records Resend viser (typisk SPF/DKIM/Return-Path).
4. Opret records hos din DNS-udbyder.
5. Vent til Resend viser domænet som `Verified`.

## 3. Opret API key i Resend
1. Gå til `API Keys` i Resend.
2. Opret en ny key til dit projekt.
3. Gem den sikkert.

## 4. Sæt lokale env vars (`.env.local`)
Tilføj:

```env
RESEND_API_KEY=din_resend_api_key
VERIFY_FROM_EMAIL="Neutral Player <noreply@ditdomæne.dk>"
INVITE_FROM_EMAIL="Neutral Player <noreply@ditdomæne.dk>"
```

Bemærk:
- `VERIFY_FROM_EMAIL` bruges til verify-mails.
- `INVITE_FROM_EMAIL` bruges til invitationer.
- Hvis `VERIFY_FROM_EMAIL` mangler, bruger koden `INVITE_FROM_EMAIL` som fallback.

## 5. Sæt env vars i Vercel
I Vercel projektet:
1. Settings -> Environment Variables
2. Tilføj samme 3 variabler:
   - `RESEND_API_KEY`
   - `VERIFY_FROM_EMAIL`
   - `INVITE_FROM_EMAIL`
3. Sæt dem for både `Preview` og `Production`.
4. Redeploy.

## 6. Test at email virker
### A. Fra appen
1. Opret ny konto.
2. Klik `Send verificeringsmail` i setup-flow.
3. Tjek at mail kommer frem.

### B. Invitation
1. Gå til `Team`.
2. Send invitation.
3. Tjek at invitationen modtages.

### C. API test (PowerShell)
Kør i terminal med env vars sat:

```powershell
$h = @{ Authorization = "Bearer $env:RESEND_API_KEY"; "Content-Type" = "application/json" }
$body = @{
  from = $env:VERIFY_FROM_EMAIL
  to = @("din-test-email@eksempel.dk")
  subject = "Resend test"
  html = "<p>Testmail fra Neutral Player</p>"
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Post -Uri "https://api.resend.com/emails" -Headers $h -Body $body
```

Forventet:
- Et JSON-svar med et mail-id.

## 7. Fejlfinding
- Ingen mails kommer frem:
  - Tjek at domænet er `Verified` i Resend.
  - Tjek at `from`-adressen matcher det verificerede domæne.
  - Tjek spamfolder.
- App viser fallback verify-link:
  - `RESEND_API_KEY`/`VERIFY_FROM_EMAIL` mangler eller er forkert.
- Invitationer virker, men verify ikke:
  - Sæt `VERIFY_FROM_EMAIL` eksplicit.

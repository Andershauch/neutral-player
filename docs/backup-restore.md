# Backup & Restore Guide
## Document Version
- Current release: v0.2.2
- Last updated: 2026-02-24

Denne guide beskriver minimum setup for backup og restore af Neutral Player.

## 1) Mål
- Minimere datatab (RPO).
- Minimere nedetid ved fejl (RTO).
- Have en dokumenteret og testet restore-proces.

## 2) Scope
- Kode og dokumentation (Git repository).
- Database (PostgreSQL via Prisma).
- Video/assets (Mux + lokale/public assets).
- Kritiske konfigurationer (Vercel env vars, Stripe/Mux/Resend setup).

## 3) Anbefalet baseline
- RPO mål: maks 24 timer.
- RTO mål: 2-4 timer for kritiske flows.
- Backupfrekvens:
  - Database: daglig fuld backup + PITR hvis muligt.
  - Repo: kontinuerlig via Git + daglig mirror.
  - Konfiguration: ved hver ændring + ugentlig snapshot.

## 4) Konkret backup-plan
### 4.1 Kode (Git)
- Primær: GitHub/Git remote med historik.
- Ekstra: daglig mirror til sekundær remote.
- Krav:
  - Beskyttet `main`.
  - PR-flow og code review.

### 4.2 Database (PostgreSQL)
- Aktiver provider-backups (Neon/Supabase/anden host).
- Aktiver PITR hvis tilgængeligt.
- Gem backup-retention mindst 14-30 dage.
- Verificer at `prisma/migrations` altid følger med i Git.

### 4.3 Video og filer
- Mux er kilde for video-playback assets.
- Gem mapping mellem jeres records og Mux asset IDs i DB.
- Backup af `public/` (f.eks. hero assets) via Git + evt. storage kopi.

### 4.4 Konfiguration og secrets
- Dokumenter alle nødvendige env vars i `docs/services.md`.
- Eksportér/snapshot Vercel env vars ved større releases.
- Opbevar secrets i godkendt secret manager (ikke i repo).

## 5) Restore-runbook (minimum)
1. Stop writes midlertidigt (maintenance mode hvis muligt).
2. Restore database til valgt tidspunkt (snapshot eller PITR).
3. Deploy matchende kodeversion (tag/commit) til Vercel.
4. Kør migration-status check:
   - `npx prisma migrate status`
5. Validér kritiske flows:
   - Login
   - Opret projekt
   - Upload/afspil video
   - Checkout/pricing side
6. Åbn writes igen og monitorér logs/fejl.

## 6) Test af restore (obligatorisk)
- Frekvens: mindst 1 gang pr. måned.
- Kør restore i separat miljø.
- Mål og noter:
  - Faktisk RTO
  - Datakonsistens
  - Eventuelle manuelle steps
- Gem resultat i kort rapport i `docs/`.

## 7) Ansvar
- Tech owner: godkender backup-politik og restore-tests.
- Drift/dev: udfører restore-test og opdaterer runbook.
- Release ansvarlig: sikrer env snapshot ved større releases.

## 8) Hurtig tjekliste før produktion
- Backup aktiveret for database.
- PITR aktiveret (hvis muligt).
- Repo mirror sat op.
- Restore-test gennemført og dokumenteret.
- Kontaktpersoner og eskalationsvej aftalt.

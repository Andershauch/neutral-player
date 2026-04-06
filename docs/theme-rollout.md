# Theme Rollout Guide
## Purpose
- Give existing customers a safe path onto the theming runtime without visual regressions.
- Ensure missing or corrupt theme payloads fall back to a valid theme source at runtime.
- Make rollout and rollback steps explicit enough to execute per environment without code changes.

## Runtime fallback
- `lib/theme.ts` validates stored theme payloads before they are applied.
- Invalid organization themes are ignored and fall back to the published global theme.
- Invalid global themes are ignored and fall back to bundled `DEFAULT_THEME_TOKENS`.
- Invalid payloads emit a structured warning and a Sentry warning event, so incidents can be diagnosed without breaking rendering.

## Backfill command
- Command: `npm run theme:backfill-default`
- Purpose: ensure one published `global_default` theme exists for rollout.
- Output: JSON summary with either `noop` or `created`.
- Expected result:
  - `noop` means the environment already has a published global default theme.
  - `created` means the script inserted the first published global default theme for that environment.
- Local verification on 2026-04-06 returned `noop`, confirming the dev database already has a published global default theme.

## Rollout phases
### Phase A: Internal dark launch
- Run `npm run theme:backfill-default` in the target environment.
- Verify internal admin theme publish and rollback still work.
- Confirm starter and free orgs render with default or global theme only.
- Completion gate:
  - no visual regression on starter org admin pages
  - no visual regression on starter org embeds
  - no repeated `Invalid theme payload detected` warnings during smoke verification

### Phase B: Pilot enterprise orgs
- Enable branding changes for 1-2 enterprise pilot customers.
- Verify admin surfaces and `/embed/[id]` player both resolve the expected theme source.
- Publish one draft theme and perform one rollback during the pilot.
- Watch logs and Sentry for repeated invalid theme warnings before expanding access.
- Completion gate:
  - pilot orgs can publish and rollback without customer-visible breakage
  - theme source resolves as `organization` for pilot orgs and `global` or `default` for non-enterprise orgs
  - no sustained warning spike in Sentry during the pilot window

### Phase C: General enterprise availability
- Keep runtime fallback enabled permanently.
- Treat invalid theme warnings as rollout regressions until volume is stable.
- Update operational runbooks if rollout observations reveal new failure modes.
- Completion gate:
  - enterprise branding is enabled for the remaining target orgs
  - repeated theme resolve warnings stay below the alert threshold
  - support and internal admins know where to find rollback steps and alert context

## Operational guardrails
- Branding API writes emit structured JSON logs with `requestId`, organization scope and theme version metadata.
- Invalid runtime theme payloads emit a structured warning and a Sentry warning event.
- Sentry alert setup for repeated runtime failures is documented in `docs/sentry-setup.md`.
- Rollback path:
  - customer orgs can publish a corrected draft from `/admin/profile/branding`
  - internal admins can publish or rollback a theme from `/internal`

## Verification checklist
- `npm run test`
- `npm run test:e2e`
- `npm run lint`
- `npm run typecheck`
- `npm run theme:backfill-default`
- Manual check: one starter org and one enterprise org in admin + embed player

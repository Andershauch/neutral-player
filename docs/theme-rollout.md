# Theme Rollout Guide
## Purpose
- Give existing customers a safe path onto the theming runtime without visual regressions.
- Ensure missing or corrupt theme payloads fall back to a valid theme source at runtime.

## Runtime fallback
- `lib/theme.ts` validates stored theme payloads before they are applied.
- Invalid organization themes are ignored and fall back to the published global theme.
- Invalid global themes are ignored and fall back to bundled `DEFAULT_THEME_TOKENS`.
- Invalid payloads emit a structured warning so incidents can be diagnosed without breaking rendering.

## Backfill command
- Command: `npm run theme:backfill-default`
- Purpose: ensure one published `global_default` theme exists for rollout.
- Output: JSON summary with either `noop` or `created`.

## Rollout phases
### Phase A: Internal dark launch
- Run `npm run theme:backfill-default` in the target environment.
- Verify internal admin theme publish/rollback still works.
- Confirm starter/free orgs render with default/global theme only.

### Phase B: Pilot enterprise orgs
- Enable branding changes for 1-2 enterprise pilot customers.
- Verify admin surfaces and `/embed/[id]` player both resolve the expected theme source.
- Watch logs for repeated invalid theme warnings before expanding access.

### Phase C: General enterprise availability
- Keep runtime fallback enabled permanently.
- Treat invalid theme warnings as rollout regressions until volume is stable.
- Update operational runbooks if rollout observations reveal new failure modes.

## Operational guardrails
- Branding API writes now emit structured JSON logs with `requestId`, organization scope and theme version metadata.
- Invalid runtime theme payloads emit a structured warning and a Sentry warning event.
- Recommended alert: trigger on repeated `Invalid theme payload detected` events in Sentry over a short window before expanding rollout.

## Verification checklist
- `npm run test`
- `npm run test:e2e`
- `npm run lint`
- `npm run typecheck`
- Manual check: one starter org and one enterprise org in admin + embed player

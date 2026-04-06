# Internal Admin Governance
## Purpose
- Define how Neutral internal access is granted and bootstrapped.
- Keep customer access and internal platform access clearly separated.

## Roles
- `np_super_admin`: full internal access, including internal branding writes, publish and rollback.
- `np_support_admin`: read-only internal access for support and diagnostics.

## Bootstrap policy
- Primary source of truth is the user's persisted `role` in the database.
- `INTERNAL_ADMIN_EMAILS` is a bootstrap fallback only.
- When an authenticated user email appears in `INTERNAL_ADMIN_EMAILS`, the app grants temporary `np_super_admin` access at runtime.
- `INTERNAL_ADMIN_EMAILS` does not create a persisted DB role and must not be used as the long-term permission model.
- Explicit internal DB roles always take precedence over the email allowlist.

## Operational rules
- Keep `INTERNAL_ADMIN_EMAILS` limited to a very small set of trusted staff emails.
- Use it for first-login bootstrap, emergency recovery or short-lived access while DB roles are being assigned.
- After bootstrap, assign the correct persisted role in the database and remove the email from `INTERNAL_ADMIN_EMAILS`.
- Prefer `np_support_admin` unless publish/write access is genuinely required.
- Review the allowlist whenever internal staff changes.

## Verification
- Internal pages under `/internal` require internal access server-side.
- Internal branding writes require `np_super_admin`.
- Audit-log events are recorded for internal publish and rollback flows.
- Unit tests cover explicit-role precedence and bootstrap fallback behavior.

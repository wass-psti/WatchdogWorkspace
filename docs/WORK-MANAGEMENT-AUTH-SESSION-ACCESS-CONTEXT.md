# M39 — Authentication, Session & Access Context Stabilization

M39 makes the authenticated access context a fail-closed runtime authority. A session is not considered authenticated until Supabase Auth user identity plus the database profile, account status, platform role, and module assignments have all been hydrated and validated.

## Authority

- Session storage/refresh: `assets/js/core/auth.ts`
- Lifecycle model: `assets/js/core/auth-state.ts`
- Atomic database context: `public.wm_auth_access_context()`
- Route authorization: `assets/js/runtime/services/route-policy.ts`
- Cache/module revocation: `assets/js/runtime/authorization-context.ts`

## Required behavior

- Stored sessions enter `restoring` before any protected route is rendered.
- Token refresh rotates credentials without changing the authenticated identity generation.
- Terminal refresh-token rejection clears the persisted session; transient backend/network failures preserve it for retry but remove runtime authorization until rehydration succeeds.
- Missing or invalid profiles never count as an active account.
- Users is restricted to `ROLE_MANAGE`; embedded module routes require the corresponding enabled assignment unless the platform role carries `module.access.all`.
- Profile/role/status/module assignments are loaded atomically from `wm_auth_access_context()` and checked against the authenticated Auth user id.
- Authorization changes clear query/transient state and detach an active module when access is revoked.

## M39 certification

Certification requires deterministic execution vectors, Playwright admin/non-admin persistence and refresh scenarios, the complete historical verifier sweep, and the governed release gate. Positive browser authorization is asserted through runtime route ownership, authenticated identity, the read-only M38 backend-preflight snapshot with the exact module marked ready, and the absence of recovery/forbidden states; it intentionally does not require Account/Users management DOM ownership. M39 does not claim recovery of the Account/Users/Settings presentation regressions that remain assigned to M40-M43.

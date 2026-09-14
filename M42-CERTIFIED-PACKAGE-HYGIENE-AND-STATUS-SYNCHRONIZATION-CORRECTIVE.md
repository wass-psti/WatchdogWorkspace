# M42 Certified Package Hygiene and Release-Status Synchronization Corrective

## Defects isolated

A continuation audit of the M42 finalization transaction found two packaging-integrity defects that were independent of Users/RBAC production runtime behavior:

1. The certified-baseline tar/ZIP path excluded ordinary generated outputs but did not explicitly exclude repository internals (`.git`), local environment overrides (`.env`, `.env.local`, `.env.*.local`), npm debug logs, `.vitest`, or M37 generated evidence. A real repository finalization could therefore publish local/private material even after application gates passed.
2. The M42 activation target was promoted to `active-certified` before packaging, but the bundled `RELEASE-STATUS-v1.43.2-STAGE-G-M42-USERS-RBAC-FUNCTIONAL-RECOVERY.md` remained `implementation-complete-pending-certification`. A successful certified ZIP could therefore contain contradictory milestone state.

## Correction

- Certified baseline construction now excludes VCS internals, local environment override files, npm debug logs, package installations, build/test output, `.vitest`, and generated M37 evidence. The staged tree is scanned and fails closed if any forbidden artifact remains.
- The finalizer snapshots the M42 release-status record together with the activation target. Any uncommitted failure restores both byte-for-byte.
- The staged release-status record is changed to `active-certified` only after dedicated source certification succeeds. A final certification section is appended to the staged record.
- Published ZIP/directory/PASS artifacts are reverified, including the published release-status state. Only then is the synchronized release-status copied back to the working tree and the transaction committed.
- The deterministic finalizer regression now proves release-status rollback, previous-artifact preservation, successful status synchronization, and exclusion of private/generated artifacts.

M42 remains fail closed until the external exact-dependency and disposable Supabase pgTAP gates can execute successfully.

## `.npmrc` secret-hygiene hardening

Because `.npmrc` is a required package-governance artifact and is intentionally retained in certified source baselines, the high-confidence secret scanner now inspects `.npmrc`. Environment-backed placeholders such as `${NPM_TOKEN}` remain valid, while literal `npm_...` access tokens and literal `_authToken`, `_auth`, or `_password` assignments fail closed. An isolated deterministic M42 regression proves both the allowed placeholder and rejected literal-credential paths.

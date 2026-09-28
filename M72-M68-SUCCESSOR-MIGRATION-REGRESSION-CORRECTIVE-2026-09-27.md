# M72 corrective — M68 successor migration regression

## Originating failure

The governed M72 deterministic sequence failed at `npm run shell-ia:test` because the M68 regression baseline still byte-hash-froze `src/app/shell/WorkManagementShell.tsx` and `src/app/shared-ui/SharedApplicationUI.tsx`.

## Root cause

M68 already declared `hostMigrationMilestone: 72`, but its deterministic verifier did not distinguish immutable runtime authorities from presentation authorities intentionally handed off to M72. M72 legitimately migrated the two React-owned host presentation consumers, so the unconditional M68 hash check contradicted M68's own successor boundary.

## Corrective change

M68 now records an explicit `successorMigratableAuthorities` allowlist containing only those two presentation consumers. Their M68-era byte hashes remain historical evidence, but from M72 onward they are protected through M68 semantic invariants plus M72 migration verification rather than frozen-byte equality. All other M68 certified authorities remain hash-enforced.

M72 deterministic verification additionally asserts the exact two-file allowlist and the M68 successor-migration policy so the exception cannot broaden silently.

## Scope

No routing, RBAC, persistence, Supabase, shell state, module business logic, or runtime ownership was changed by this corrective patch.

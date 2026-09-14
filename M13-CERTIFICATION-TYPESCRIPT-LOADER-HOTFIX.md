# M13 Certification TypeScript Loader Hotfix

## Failure observed

The first authoritative Mac certification attempt reached the M13 historical Account / Settings / User Management regression chain after passing source integrity, governed Node 22.16.0/npm 10.9.2 handoff, exact dependency installation, M10-M13 architecture preflight, and strict TypeScript.

The first actual failure was:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for assets/js/core/platform.ts
```

The failing launcher was `node verify-settings.mjs`. `verify-settings.mjs` dynamically imports authoritative TypeScript modules including `assets/js/core/platform.ts`, `config/modules.ts`, and `assets/js/core/backup.ts`.

## Root cause

The project intentionally runs TypeScript-aware verification under Node 22 using `--experimental-strip-types`. The M13 certification script's three direct historical verifier launches were the only regression-chain commands that bypassed that established loader contract. This was a certification-entrypoint defect, not an M13 runtime or TypeScript compilation defect.

## Correction

All three direct M13 historical verifier launches now use:

```text
node --experimental-strip-types --disable-warning=ExperimentalWarning <verifier>.mjs
```

This applies uniformly to:

- `verify-account-architecture.mjs`
- `verify-settings.mjs`
- `verify-rbac-user-management.mjs`

The M13 milestone verifier now asserts this execution contract and rejects raw direct launches of these verifiers.

## Scope

No application TS/TSX/CSS behavior changed. No package or lockfile dependency changed. No Supabase schema/migration changed. No M13 ownership boundary changed. Architecture Version remains 23 and M13 remains `implementation-complete-pending-certification` until the complete Mac release certification passes.

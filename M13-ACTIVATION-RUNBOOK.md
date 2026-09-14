# Stage C M13 — Account / Settings / User Management Activation Runbook

M13 ships implementation-complete and must be promoted only after M12 is `active-certified`.

Do **not** begin M13 certification with a raw ambient `npm ci`. Enter through the governed shell-level entrypoint so the first dependency installation already runs under Node `22.16.0` and npm `10.9.2`.

## Toolchain check

```bash
bash scripts/certify-stage-c-m13.sh --toolchain-check
```

## TypeScript loader hotfix

The M13 certification regression chain launches its three direct historical verifiers with Node's governed TypeScript stripping enabled:

```text
node --experimental-strip-types --disable-warning=ExperimentalWarning <verifier>.mjs
```

This is required because `verify-settings.mjs` dynamically imports authoritative `.ts` modules. Raw `node verify-settings.mjs` under Node 22.16.0 fails with `ERR_UNKNOWN_FILE_EXTENSION`. The hotfix changes certification execution only; it does not change M13 application/runtime behavior.

## Complete certification

```bash
bash scripts/certify-stage-c-m13.sh
```

The certification performs exact lockfile installation, M10/M11/M12/M13 architecture checks, Account/Settings/RBAC historical regression checks, strict TypeScript, complete UI verification, dev browser smoke, production build, dist verification, preview browser smoke, Stage C release certification, and final status reporting.

No Supabase migration is required for M13.

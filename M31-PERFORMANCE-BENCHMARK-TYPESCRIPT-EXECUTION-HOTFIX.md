# M31 Performance Benchmark TypeScript Execution Hotfix

## Problem

The first authoritative M31 certification run reached `npm run performance:bench` under governed Node 22.16.0 and failed before measurements with `ERR_UNKNOWN_FILE_EXTENSION` because `scripts/run-performance-benchmarks.mjs` imports the authoritative `.ts` Board virtualization and route-policy modules while the package script launched the runner with plain `node`.

## Correction

The governed benchmark command now launches Node 22.16.0 with `--experimental-strip-types`:

```text
node --experimental-strip-types scripts/run-performance-benchmarks.mjs
```

No third-party TypeScript execution dependency was added. The M29-certified application lockfile remains unchanged. M31's static verifier now requires both the execution-mode authority and the exact package-script flag so a plain-Node regression is rejected before release certification.

## Scope

This hotfix changes only the M31 performance-tooling execution contract and its documentation/verifier metadata. It does not alter application business behavior, database schema, migrations, M30 modern-test authority, or the governed Node/npm versions.

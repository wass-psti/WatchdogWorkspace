# Stage C M11 Governed Bootstrap Hotfix

## Problem

The first dependency-restoration command in the M11 Mac certification sequence was a raw `npm ci`. On a host whose ambient terminal was running Node `v24.20.0` and npm `11.19.0`, `.npmrc` correctly enforced `engine-strict=true` and rejected the install because the governed project toolchain is Node `22.16.0` / npm `10.9.2`.

This was a certification-entrypoint defect, not an M11 Global Overlays runtime or source defect.

## Correction

- Added `scripts/certify-stage-c-m11.sh` as a shell-level certification entrypoint.
- The entrypoint invokes `scripts/run-governed-toolchain.sh` before any npm command executes.
- Dependency restoration (`npm ci`) and every subsequent M10/M11/release/status gate therefore run inside the governed Node `22.16.0` / npm `10.9.2` process.
- The engine policy is unchanged. `engine-strict=true`, the Node 22 engine range, `.nvmrc`, and `packageManager: npm@10.9.2` remain authoritative.
- No application runtime behavior, overlay authority, Supabase schema, dependency version, or lockfile graph was changed.

## Certification

From the extracted package, run:

```bash
bash scripts/certify-stage-c-m11.sh
```

To verify only the toolchain handoff without installing dependencies or running certification:

```bash
bash scripts/certify-stage-c-m11.sh --toolchain-check
```

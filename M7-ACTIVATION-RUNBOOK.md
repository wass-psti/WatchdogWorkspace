# Stage B M7 Activation Runbook — Supabase Client Adapter

## Prerequisite

Stage B M6 must report `active-certified`.

## Full certification

From the extracted project root:

```bash
npm run stage-b:certify
npm run design-system:status
npm run interactions:status
npm run runtime-schemas:status
npm run supabase-client:status
```

The public commands enter through `scripts/run-governed-toolchain.sh`, which resolves the governed Node 22.16.0 / npm 10.9.2 toolchain.

## M7-only verification

```bash
npm run supabase-client:check
npm run supabase-client:status
```

## M7-only activation

```bash
npm run supabase-client:activate
npm run supabase-client:status
```

This promotes the adapter to `active-pending-release-certification` after governance, security, M3–M6, M7, ESLint and strict TypeScript gates pass.

## M7 release certification

```bash
npm run supabase-client:activate:release
npm run supabase-client:status
```

This additionally runs the dependency audit and complete production release gate before promoting M7 to `active-certified`.

## Expected final state

```text
Stage B platform certification: PASS
M4 React Design System: active-certified
M5 Primitive Interaction Architecture: active-certified
M6 Runtime Schemas: active-certified
M7 Supabase Client Adapter: active-certified
```

No Supabase migration is introduced by M7.
